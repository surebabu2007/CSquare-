import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppState, ComicPanelData, StoryPreferences, ComicHistoryItem } from './types';
import LandingPage from './components/LandingPage';
import ComicViewer from './components/ComicViewer';
import { generateComicStory, generatePanelImage, generateCoverImage, generateSpeech } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { Spinner } from './components/Spinner';

export interface AudioState {
  isLoading: boolean;
  isPlaying: boolean;
  panelId: number | null;
}

const HISTORY_KEY = 'csrComicCreator_history';
const MAX_HISTORY_ITEMS = 6;


function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [comicPanels, setComicPanels] = useState<ComicPanelData[]>([]);
  const [comicTitle, setComicTitle] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('BUILDING YOUR LEGEND...');
  const [audioState, setAudioState] = useState<AudioState>({ isLoading: false, isPlaying: false, panelId: null });
  const [history, setHistory] = useState<ComicHistoryItem[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to load history from localStorage", e);
      localStorage.removeItem(HISTORY_KEY);
    }
  }, []);

  const handleCreateComic = useCallback(async function(preferences: StoryPreferences, imageFiles: File[]) {
    setAppState('generating');
    setError(null);
    setComicPanels([]); // Clear old panels
    
    try {
      const imagePromises = imageFiles.map(async (file) => {
        const data = await fileToBase64(file);
        return { data, mimeType: file.type };
      });
      const imageParts = await Promise.all(imagePromises);

      // 1. Generate story structure
      setLoadingMessage('Generating your 15-panel story...');
      const storyData = await generateComicStory(preferences, imageParts);
      setComicTitle(storyData.title);

      // 2. Generate cover image
      setLoadingMessage('Designing the comic book cover...');
      const generatedCover = await generateCoverImage(storyData.cover_page_prompt);
      setCoverImage(generatedCover);

      // 3. Generate panel images sequentially to avoid rate limiting
      const allPanels: ComicPanelData[] = [];
      for (const [index, panelInfo] of storyData.panels.entries()) {
        setLoadingMessage(`Rendering panel ${index + 1} of ${storyData.panels.length}...`);
        
        const panelImage = await generatePanelImage(panelInfo.image_prompt);
        
        allPanels.push({
          id: panelInfo.panel,
          image: panelImage,
          dialogue: panelInfo.dialogue,
          character: panelInfo.character_name,
          layoutDescription: panelInfo.panel_layout_description,
          voiceSuggestion: panelInfo.voice_suggestion,
          transform: { x: 0, y: 0, scale: 1 },
        });
      }

      setComicPanels(allPanels);
      setAppState('viewing');

      // Save to history
      const newHistoryItem: ComicHistoryItem = {
        id: new Date().toISOString(), // Unique ID based on timestamp
        createdAt: new Date().toISOString(),
        title: storyData.title,
        coverImage: generatedCover,
        panels: allPanels,
      };

      setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        return updatedHistory;
      });

    } catch (err) {
      console.error('Failed to create comic:', err);
      let errorMessage = 'An unknown error occurred during comic creation.';
       if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      try {
        const errorString = JSON.stringify(err);
        if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
           errorMessage = "The image generation service is currently busy. Please wait a moment and try again.";
        }
      } catch(e) { /* Silently ignore parsing error */ }

      setError(errorMessage);
      setAppState('landing');
    }
  }, []);
  
  const handleLoadComic = useCallback((comicId: string) => {
    const comicToLoad = history.find(item => item.id === comicId);
    if (comicToLoad) {
      setError(null);
      setComicTitle(comicToLoad.title);
      setCoverImage(comicToLoad.coverImage);
      setComicPanels(comicToLoad.panels);
      setAppState('viewing');
    }
  }, [history]);

  const handleDeleteComic = useCallback((comicId: string) => {
    setHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.id !== comicId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }, []);

  function handleReset() {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
    }
    setAudioState({ isLoading: false, isPlaying: false, panelId: null });
    setAppState('landing');
    setComicPanels([]);
    setComicTitle('');
    setCoverImage('');
    setError(null);
  }
  
  function handleUpdatePanelImage(panelId: number, newImage: string) {
    setComicPanels(prevPanels => 
      prevPanels.map(p => p.id === panelId ? { ...p, image: newImage } : p)
    );
  }
  
  function handleUpdatePanelTransform(panelId: number, newTransform: { x: number, y: number, scale: number }) {
    setComicPanels(prevPanels =>
      prevPanels.map(p => p.id === panelId ? { ...p, transform: newTransform } : p)
    );
  }

  const handlePlayAudio = useCallback(async (panelId: number, text: string, voiceSuggestion: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioState.panelId === panelId && audioState.isPlaying) {
      setAudioState({ isLoading: false, isPlaying: false, panelId: null });
      return;
    }

    setAudioState({ isLoading: true, isPlaying: false, panelId });
    try {
      const audioBase64 = await generateSpeech(text, voiceSuggestion);
      const audio = new Audio(`data:audio/webm;base64,${audioBase64}`);
      audioRef.current = audio;
      
      audio.play();
      setAudioState({ isLoading: false, isPlaying: true, panelId });

      audio.onended = () => {
        setAudioState({ isLoading: false, isPlaying: false, panelId: null });
        audioRef.current = null;
      };
    } catch (err) {
      console.error("Failed to play audio:", err);
      setError("Sorry, couldn't generate voice-over.");
      setAudioState({ isLoading: false, isPlaying: false, panelId: null });
    }
  }, [audioState.panelId, audioState.isPlaying]);

  return (
    <div className="min-h-screen bg-csr-dark font-sans overflow-x-hidden">
      <AnimatePresence mode="wait">
        {appState === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <LandingPage 
              onCreateComic={handleCreateComic} 
              error={error}
              history={history}
              onLoadComic={handleLoadComic}
              onDeleteComic={handleDeleteComic}
            />
          </motion.div>
        )}
        {appState === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen text-center p-4"
          >
            <Spinner />
            <h2 className="text-2xl md:text-4xl font-black mt-6 text-csr-blue animate-pulse">{loadingMessage}</h2>
            <p className="text-csr-light-gray mt-2">Your epic is being forged. This can take a few minutes for 15 panels.</p>
          </motion.div>
        )}
        {appState === 'viewing' && (
          <motion.div
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ComicViewer 
              title={comicTitle} 
              coverImage={coverImage}
              panels={comicPanels} 
              onReset={handleReset}
              onUpdatePanelImage={handleUpdatePanelImage}
              onUpdatePanelTransform={handleUpdatePanelTransform}
              onPlayAudio={handlePlayAudio}
              audioState={audioState}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
