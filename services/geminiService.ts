import { GoogleGenAI, Modality, Type } from '@google/genai';
import type { StoryPreferences, ImagePart, ComicStoryResponse } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const comicStorySchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A catchy, cool title for the comic book story, in the style of a blockbuster movie.'
    },
    cover_page_prompt: {
      type: Type.STRING,
      description: "A single, highly detailed image generation prompt for a comic book cover. It must include the comic's title, the main character's detailed description, the chosen art style, and a sense of dynamic action. The prompt must be suitable for a portrait (9:16) aspect ratio image."
    },
    panels: {
      type: Type.ARRAY,
      description: 'An array of exactly 15 comic book panels that tell a complete story.',
      items: {
        type: Type.OBJECT,
        properties: {
          panel: {
            type: Type.INTEGER,
            description: 'The panel number, starting from 1 up to 15.'
          },
          image_prompt: {
            type: Type.STRING,
            description: "CRITICAL: An extremely detailed image generation prompt. It MUST begin with the unchanging, detailed description of the main character derived from user images. It MUST be overwhelmingly saturated with the user's chosen art style, influencing lighting, color, and mood. Describes a dynamic scene fitting the CSR Racing 2 world for a square (1:1) image."
          },
          dialogue: {
            type: Type.STRING,
            description: "The dialogue or narration for this panel. Keep it concise, organic, and impactful, like in a real comic book. Use ALL CAPS for emphasis where appropriate."
          },
          character_name: {
            type: Type.STRING,
            description: "The name of the character speaking, or 'Narrator' for narration boxes."
          },
          panel_layout_description: {
              type: Type.STRING,
              description: "A short hint for the frontend layout of this panel. Examples: 'full-width', 'half-width-left', 'small-inset', 'tall-vertical'."
          },
          preferred_model: {
            type: Type.STRING,
            description: "The ideal image generation model for this specific panel. Use 'nano_banana' for panels where the main character is clearly visible and consistency is paramount. Use 'imagen_4' for high-detail establishing shots, scenery, close-ups on objects, or where the character is small/unimportant in the frame."
          }
        },
        required: ['panel', 'image_prompt', 'dialogue', 'character_name', 'panel_layout_description', 'preferred_model']
      }
    }
  },
  required: ['title', 'cover_page_prompt', 'panels']
};

export async function generateComicStory(preferences: StoryPreferences, userImages: ImagePart[]): Promise<ComicStoryResponse> {
  const model = 'gemini-2.5-pro';
  const prompt = `
    You are a world-class comic book creator and screenwriter, a master of visual storytelling, specializing in the high-octane world of CSR Racing 2. Your task is to generate a complete 15-panel comic story from user images and preferences. You must follow the instructions below with absolute precision.

    **USER PREFERENCES:**
    - Mood: ${preferences.mood}
    - Story Type: ${preferences.storyType}
    - Art Style: ${preferences.artStyle}
    - Custom Story Goal: ${preferences.storyDescription || 'A classic racing tale of a newcomer rising through the ranks.'}

    **CRITICAL INSTRUCTION 1: UNWAVERING CHARACTER CONSISTENCY (ABSOLUTE HIGHEST PRIORITY)**
    - **Analyze and Define:** Before doing anything else, you MUST meticulously analyze the user-uploaded images. Create a highly detailed, internal "character sheet" for the protagonist. This includes, but is not limited to: facial structure, jawline, eye shape and color, hair style and color, skin tone, ethnicity, estimated age, typical expression, body build, and specific clothing style.
    - **Mandatory Prefix:** EVERY SINGLE 'image_prompt' you generate MUST start with this exact, consistent character description. This is a non-negotiable rule. Do not deviate. The character must be instantly recognizable as the same person in every single panel.
    - **Example of a good prefix:** "A [age] year-old [ethnicity] man with [hair style/color], a [jawline shape] jawline, [eye description], wearing a [clothing description]..."
    - **Consequence:** Failure to maintain perfect visual consistency of the protagonist across all 15 panels is a total failure of the task.

    **CRITICAL INSTRUCTION 2: DOMINANT ART STYLE INFLUENCE**
    - **Style is Law:** The user's chosen Art Style, "${preferences.artStyle}", is not a suggestion—it is an absolute directive that must dominate the visual identity of every panel and the cover.
    - **Deconstruct and Apply:** Internally deconstruct the chosen art style into its core visual elements (e.g., for 'Gritty Noir', this means high-contrast black and white, deep shadows, dramatic lighting, film grain). Then, explicitly apply these elements in your 'image_prompt' descriptions.
    - **Total Immersion:** The art style must influence everything: the color palette, lighting, line work, texture, composition, and the overall mood. The final output must look like it was hand-drawn by an artist who ONLY works in that specific style.

    **CRITICAL INSTRUCTION 3: INTELLIGENT MODEL SELECTION**
    - **Analyze Panel Content:** For each panel, determine its primary visual focus.
    - **Assign Model:** Based on the focus, set the 'preferred_model' field.
      - If the panel is a close-up or medium shot where the main character's face/body is clearly visible and recognizable, set 'preferred_model' to 'nano_banana'. This model excels at maintaining character consistency.
      - If the panel is an establishing shot, a landscape, a close-up of an object (like a car engine or a trophy), or a scene where the character is distant or obscured, set 'preferred_model' to 'imagen_4'. This model provides superior detail for non-character-focused visuals.
    - **Coherence:** Both models must be guided by the same character description prefix and art style directives to ensure a cohesive final comic.

    **STORY & STRUCTURE:**
    - **CSR2 Universe:** The story must feel authentic to the CSR Racing 2 world. Reference its lore, factions (e.g., Shax Industries, Gold Rushers), and high-stakes racing culture.
    - **15-Panel Arc:** Craft a complete story over EXACTLY 15 panels. It must have a clear beginning, a rising action, a climax, and a resolution.
    - **Dynamic Cover:** The 'cover_page_prompt' must be for a dynamic, portrait-aspect-ratio (9:16) comic cover. It must feature the generated title, the consistent main character prominently, and be a perfect embodiment of the chosen Art Style and Mood.

    **OUTPUT FORMAT:**
    - Generate a single, clean JSON object that strictly adheres to the provided schema. Do not output any text, apologies, or explanations before or after the JSON.
  `;

  const contents = {
    parts: [
      ...userImages.map(img => ({ inlineData: { data: img.data, mimeType: img.mimeType } })),
      { text: prompt }
    ]
  };

  const response = await ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: comicStorySchema,
    },
  });

  const jsonText = response.text.trim();
  try {
    const parsed = JSON.parse(jsonText) as ComicStoryResponse;
    if (!parsed.panels || parsed.panels.length === 0) {
        throw new Error("The model returned a story with no panels.");
    }
    return parsed;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonText);
    throw new Error("The model returned an invalid story format. Please try again.");
  }
}

export async function generatePanelImage(prompt: string, modelHint?: 'nano_banana' | 'imagen_4'): Promise<string> {
    // Use Imagen 4 for high-detail scenery or object shots
    if (modelHint === 'imagen_4') {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1', // Panels are square
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
            return response.generatedImages[0].image.imageBytes;
        }
        
        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Panel image generation with Imagen 4 was blocked or failed, possibly for safety reasons.");
        }
        
        throw new Error("Panel image generation with Imagen 4 failed or returned no data.");
    }
    
    // Default to Nano Banana (gemini-2.5-flash-image) for character consistency
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
            return part.inlineData.data;
        }
    }
    
    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("Panel image generation was blocked for safety reasons. Please try a different story prompt.");
    }
    
    throw new Error("Panel image generation failed or returned no data.");
}

export async function generateCoverImage(prompt: string): Promise<string> {
    // Using Imagen 4 for the highest quality cover image.
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt, // The prompt from the story generator is already highly detailed.
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '9:16', // Enforce the portrait aspect ratio for a cover.
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
        return response.generatedImages[0].image.imageBytes;
    }
    
    // Check for safety or other generation failures.
    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Cover image generation was blocked or failed, possibly for safety reasons. Please try a different story prompt.");
    }

    throw new Error("Cover image generation failed or returned no data.");
}

export async function editImage(baseImage: ImagePart, prompt: string): Promise<string> {
    const model = 'gemini-2.5-flash-image';
    
    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
            return part.inlineData.data;
        }
    }

    if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        throw new Error("Image editing was blocked for safety reasons. Please try a different prompt.");
    }

    throw new Error("Image editing failed or returned no data.");
}