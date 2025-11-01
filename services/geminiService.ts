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
            description: "CRITICAL: A hyper-detailed prompt for an image generator. It MUST begin with the consistent, detailed description of the main character derived from the user's images. It MUST specify the user's chosen art style. The prompt should describe a dynamic scene fitting the CSR Racing 2 aesthetic, including cars and settings for a square (1:1) image."
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
          voice_suggestion: {
              type: Type.STRING,
              description: "A brief description of the character's vocal tone for text-to-speech. Examples: 'Deep, gravelly male voice', 'Calm, authoritative female narrator', 'Young, energetic rival'."
          }
        },
        required: ['panel', 'image_prompt', 'dialogue', 'character_name', 'panel_layout_description', 'voice_suggestion']
      }
    }
  },
  required: ['title', 'cover_page_prompt', 'panels']
};

export async function generateComicStory(preferences: StoryPreferences, userImages: ImagePart[]): Promise<ComicStoryResponse> {
  const model = 'gemini-2.5-pro';
  const prompt = `
    You are an expert comic book creator and screenwriter, deeply immersed in the gritty, high-octane world of CSR Racing 2. Your mission is to generate a complete 15-panel comic story based on user-provided images and preferences, drawing heavily from the official lore and aesthetic of the CSR2 universe.

    **REFERENCE LORE:** Your primary source of inspiration for tone, factions, characters, and events should be the world described on the official CSR Racing 2 website (csr-racing.com). Mention specific crews (like Shax Industries, Gold Rushers), events, and the general vibe of high-stakes underground racing.

    **USER PREFERENCES:**
    - Mood: ${preferences.mood}
    - Story Type: ${preferences.storyType}
    - Art Style: ${preferences.artStyle}
    - Custom Story Goal: ${preferences.storyDescription || 'A classic racing tale of a newcomer rising through the ranks.'}

    **CRITICAL INSTRUCTIONS:**
    1.  **Character Analysis (HIGHEST PRIORITY):** Your first and most critical task is to ensure character consistency. Meticulously analyze the user-uploaded images to create a detailed "character sheet" for the protagonist. This sheet should include facial structure, hair style and color, ethnicity, typical expression, and clothing style. The character in every single panel MUST look IDENTICAL to the person in these images.

    2.  **Maintain Consistency:** For EVERY 'image_prompt' you generate, you MUST begin with the detailed character description from your character sheet. This is non-negotiable for visual consistency. Example: "A man in his late 20s with short, black hair, a sharp jawline, wearing a worn leather jacket, is seen..."

    3.  **Art Style & Logos:** Every 'image_prompt' MUST strongly adhere to the user's chosen art style: "${preferences.artStyle}". Also, subtly integrate logos and iconography from CSR2 factions where appropriate. Describe them textually, e.g., "...a shipping container in the background is tagged with the spray-painted logo of the 'Los Vagos' crew."

    4.  **Voice & Dialogue:** For each character (including the Narrator), provide a 'voice_suggestion'. This should be a brief description of their vocal tone (e.g., "Deep, gravelly male voice," "Calm, authoritative female narrator," "Young, energetic rival"). The dialogue itself must be concise, punchy, organic, and authentic to street racing culture.

    5.  **Story Arc & Pacing:** Craft a compelling and complete story over EXACTLY 15 panels. The story must have a clear beginning, middle, and a definitive end, maintaining a consistent narrative thread and natural flow from one panel to the next.

    6. **Cover Page:** Generate a single, powerful 'cover_page_prompt'. This prompt should be for a dynamic portrait-aspect-ratio (9:16) comic book cover that includes the generated title, features the main character prominently, and perfectly captures the selected Art Style and Mood.

    7.  **WHAT TO AVOID (Negative Prompts):** Actively prevent common visual glitches. Do not merge characters with objects (e.g., a steering wheel is held, not fused to hands). Avoid distorted faces, extra limbs, or nonsensical backgrounds. The final image must be clean, coherent, and believable.

    8.  **Output Format:** Generate a single JSON object that strictly adheres to the provided schema. Do not output anything else.
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

export async function generatePanelImage(prompt: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    if (base64ImageBytes) {
        return base64ImageBytes;
    }

    throw new Error("Image generation failed or returned no data.");
}

export async function generateCoverImage(prompt: string): Promise<string> {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '9:16',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    if (base64ImageBytes) {
        return base64ImageBytes;
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

    const firstPart = response.candidates?.[0]?.content?.parts?.[0];
    if (firstPart?.inlineData?.data) {
        return firstPart.inlineData.data;
    }

    throw new Error("Image editing failed or returned no data.");
}

// A simple mapping from descriptive terms to available voice names
const voiceMap: { [key: string]: string } = {
  'male': 'Kore',
  'female': 'Puck', // Note: API voice names are not strictly gendered.
  'narrator': 'Charon',
  'deep': 'Fenrir',
  'energetic': 'Zephyr',
  'default': 'Kore',
};

function getVoiceName(suggestion: string): string {
  const lowerSuggestion = suggestion.toLowerCase();
  for (const key in voiceMap) {
    if (lowerSuggestion.includes(key)) {
      return voiceMap[key];
    }
  }
  return voiceMap['default'];
}

export async function generateSpeech(text: string, voiceSuggestion: string): Promise<string> {
  const model = "gemini-2.5-flash-preview-tts";
  const voiceName = getVoiceName(voiceSuggestion);

  const ttsPrompt = `Speak this line with appropriate emotion based on the text: "${text}"`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: ttsPrompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const audioPart = response.candidates?.[0]?.content?.parts?.[0];
  if (audioPart?.inlineData?.data) {
    return audioPart.inlineData.data;
  }

  throw new Error("Text-to-speech generation failed.");
}
