export type AppState = 'landing' | 'generating' | 'viewing';

export interface StoryPreferences {
  mood: 'Gritty & Intense' | 'High-Octane Action' | 'Dramatic & Emotional' | 'Sleek & Stylish';
  storyType: 'Origin Story' | 'Rivalry' | 'Underdog Victory' | 'Heist';
  storyDescription: string;
  artStyle: string;
}

export interface ComicPanelData {
  id: number;
  image: string; // base64 encoded image
  dialogue: string;
  character: string | 'Narrator';
  layoutDescription: string;
  voiceSuggestion: string; // e.g., "Deep, gravelly male voice"
  transform?: { x: number; y: number; scale: number };
}

export interface ImagePart {
  data: string; // base64
  mimeType: string;
}

// Structures expected from the Gemini API
export interface RawComicPanel {
  panel: number;
  image_prompt: string;
  dialogue: string;
  character_name: string;
  panel_layout_description: string;
  voice_suggestion: string;
}

export interface ComicStoryResponse {
  title: string;
  panels: RawComicPanel[];
  cover_page_prompt: string;
}

export interface ComicHistoryItem {
  id: string;
  createdAt: string; // ISO string date
  title: string;
  coverImage: string; // base64
  panels: ComicPanelData[];
}
