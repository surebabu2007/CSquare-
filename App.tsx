import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AppState, ComicPanelData, StoryPreferences, ComicHistoryItem } from './types';
import LandingPage from './components/LandingPage';
import ComicViewer from './components/ComicViewer';
import { generateComicStory, generatePanelImage, generateCoverImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { ForgingAnimation } from './components/ForgingAnimation';
import HistoryItem from './components/HistoryItem';
import { PlusCircle } from './components/icons';

const HISTORY_KEY = 'csrComicCreator_history';
const MAX_HISTORY_ITEMS = 3; // Reduced to prevent storage quota errors

// A local component for the new persistent sidebar
function HistoryPanel({ 
  history, 
  activeComicId, 
  onLoadComic, 
  onDeleteComic, 
  onNewComic 
}: {
  history: ComicHistoryItem[],
  activeComicId: string | null,
  onLoadComic: (id: string) => void,
  onDeleteComic: (id: string) => void,
  onNewComic: () => void,
}) {
  useEffect(() => {
    // Ensure lucide icons in the panel are rendered on updates
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  return (
    <aside className="w-80 bg-black/40 h-full flex flex-col border-r border-csr-light-gray/20 shadow-lg">
      <div className="p-4 border-b border-csr-light-gray/20">
        <button onClick={onNewComic} className="w-full flex items-center justify-center gap-2 text-white bg-csr-blue hover:bg-blue-500 font-bold py-2 px-4 rounded-lg transition-colors">
          <PlusCircle className="w-5 h-5" />
          New Comic
        </button>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-3">
        {history.length > 0 ? history.map(item => (
          <HistoryItem
            key={item.id}
            item={item}
            onLoad={onLoadComic}
            onDelete={onDeleteComic}
            isActive={item.id === activeComicId}
          />
        )) : (
           <div className="flex items-center justify-center h-full text-center text-csr-light-gray">
             <p>Your created comics will appear here.</p>
           </div>
        )}
      </div>
    </aside>
  );
}


function App() {
  const [appState, setAppState] = useState<AppState>('landing');
  const [comicPanels, setComicPanels] = useState<ComicPanelData[]>([]);
  const [comicTitle, setComicTitle] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [comicId, setComicId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('BUILDING YOUR LEGEND...');
  const [history, setHistory] = useState<ComicHistoryItem[]>([]);
  const generationController = useRef<AbortController | null>(null);
  
  const resetState = useCallback(() => {
    generationController.current?.abort();
    generationController.current = null;
    setAppState('landing');
    setComicPanels([]);
    setComicTitle('');
    setCoverImage('');
    setComicId(null);
    setError(null);
    setLoadingMessage('BUILDING YOUR LEGEND...');
  }, []);

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

  useEffect(() => {
    if (appState !== 'viewing' || !comicPanels.some(p => p.imageState === 'loading')) {
      return;
    }

    generationController.current?.abort();
    generationController.current = new AbortController();
    const signal = generationController.current.signal;

    const generateAllPanels = async () => {
      const panelsToGenerate = [...comicPanels];

      for (const panel of panelsToGenerate) {
        if (panel.imageState === 'loading') {
          if (signal.aborted) return;

          try {
            const panelImage = await generatePanelImage(panel.imagePrompt!, panel.preferred_model);
            if (signal.aborted) return;
            
            setComicPanels(prevPanels =>
              prevPanels.map(p =>
                p.id === panel.id
                  ? { ...p, image: panelImage, imageState: 'loaded' }
                  : p
              )
            );
          } catch (err) {
            if (signal.aborted) return;
            console.error(`Failed to generate panel ${panel.id}:`, err);
            setComicPanels(prevPanels =>
              prevPanels.map(p =>
                p.id === panel.id
                  ? { ...p, imageState: 'error' }
                  : p
              )
            );
          }
        }
      }
    };

    generateAllPanels();

    return () => {
      generationController.current?.abort();
    };
  }, [appState, comicId]);


  // Effect to save the completed comic to history
  useEffect(() => {
    const isGenerating = comicPanels.some(p => p.imageState === 'loading');
    const isGenerated = comicPanels.length > 0 && !isGenerating && comicId;
    const existsInHistory = history.some(item => item.id === comicId);

    if (appState === 'viewing' && isGenerated && !existsInHistory) {
      const finalPanelsForHistory = comicPanels.map(p => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { imageState, imagePrompt, preferred_model, ...rest } = p;
        return rest;
      });

      const newHistoryItem: ComicHistoryItem = {
        id: comicId,
        createdAt: new Date().toISOString(),
        title: comicTitle,
        coverImage: coverImage,
        panels: finalPanelsForHistory,
      };

      setHistory(prevHistory => {
        const updatedHistory = [newHistoryItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch (e) {
            console.error("Failed to save history to localStorage. Storage might be full.", e);
        }
        return updatedHistory;
      });
    }
  }, [appState, comicPanels, comicTitle, coverImage, history, comicId]);

  const updateHistoryItem = (comicIdToUpdate: string, updatedPanels: ComicPanelData[]) => {
      setHistory(prevHistory => {
          const newHistory = prevHistory.map(item => {
              if (item.id === comicIdToUpdate) {
                  const finalPanelsForHistory = updatedPanels.map(p => {
                      const { imageState, imagePrompt, preferred_model, ...rest } = p;
                      return rest;
                  });
                  return { ...item, panels: finalPanelsForHistory };
              }
              return item;
          });
          try {
              localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
          } catch (e) {
              console.error("Failed to update history in localStorage. Storage might be full.", e);
          }
          return newHistory;
      });
  };

  const handleCreateComic = useCallback(async (preferences: StoryPreferences, imageFiles: File[]) => {
    setAppState('generating');
    setError(null);
    setComicId(null);
    generationController.current?.abort();

    try {
      setLoadingMessage('ANALYZING CHARACTERS & CRAFTING STORY...');
      const imageParts = await Promise.all(
        imageFiles.map(async (file) => ({
          data: await fileToBase64(file),
          mimeType: file.type,
        }))
      );
      
      const story = await generateComicStory(preferences, imageParts);

      setLoadingMessage('FORGING THE COVER...');
      const cover = await generateCoverImage(story.cover_page_prompt);
      
      setComicTitle(story.title);
      setCoverImage(cover);
      setComicPanels(story.panels.map(p => ({
        id: p.panel,
        image: '',
        dialogue: p.dialogue,
        character: p.character_name,
        layoutDescription: p.panel_layout_description,
        imageState: 'loading',
        imagePrompt: p.image_prompt,
        preferred_model: p.preferred_model,
      })));
      setComicId(`comic_${Date.now()}`);
      setAppState('viewing');

    } catch (err) {
      console.error("Comic generation failed:", err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState('landing');
    }
  }, []);

  const handleUpdatePanel = useCallback((panelId: number, newImage: string) => {
    setComicPanels(prevPanels => {
      const newPanels = prevPanels.map(p =>
        p.id === panelId ? { ...p, image: newImage } : p
      );
      if (comicId) {
        updateHistoryItem(comicId, newPanels);
      }
      return newPanels;
    });
  }, [comicId]);
  
  const handleUpdateTransform = useCallback((panelId: number, newTransform: { x: number; y: number; scale: number; rotation: number }) => {
    setComicPanels(prevPanels => {
        const newPanels = prevPanels.map(p =>
            p.id === panelId ? { ...p, transform: newTransform } : p
        );
        if (comicId) {
            updateHistoryItem(comicId, newPanels);
        }
        return newPanels;
    });
  }, [comicId]);

  const handleRetryPanel = useCallback(async (panelId: number) => {
    const panelToRetry = comicPanels.find(p => p.id === panelId);
    if (!panelToRetry || !panelToRetry.imagePrompt) return;

    setComicPanels(prev => prev.map(p => p.id === panelId ? { ...p, imageState: 'loading' } : p));
    
    try {
        const panelImage = await generatePanelImage(panelToRetry.imagePrompt, panelToRetry.preferred_model);
        setComicPanels(prev => prev.map(p => p.id === panelId ? { ...p, image: panelImage, imageState: 'loaded' } : p));
    } catch(err) {
        console.error(`Failed to retry panel ${panelId}:`, err);
        setComicPanels(prev => prev.map(p => p.id === panelId ? { ...p, imageState: 'error' } : p));
    }
  }, [comicPanels]);
  
  const handleLoadComic = useCallback((id: string) => {
    const item = history.find(h => h.id === id);
    if (item) {
      generationController.current?.abort();
      generationController.current = null;

      setError(null);
      setComicId(item.id);
      setComicTitle(item.title);
      setCoverImage(item.coverImage);
      setComicPanels(item.panels.map(p => ({ ...p, imageState: 'loaded' })));
      setAppState('viewing');
    }
  }, [history]);

  const handleDeleteComic = useCallback((id: string) => {
    setHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(item => item.id !== id);
        try {
            localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
        } catch(e) {
            console.error("Failed to update history in localStorage after deletion", e);
        }
        return updatedHistory;
    });
    // If the active comic is deleted, just deselect it from the history panel.
    // This prevents the user from being kicked out of the viewer.
    if (comicId === id) {
        setComicId(null);
    }
  }, [comicId]);
  
  const handleNewComic = useCallback(() => {
    resetState();
  }, [resetState]);

  return (
    <div className="flex h-screen w-screen font-sans bg-csr-dark">
        <HistoryPanel
          history={history}
          activeComicId={comicId}
          onLoadComic={handleLoadComic}
          onDeleteComic={handleDeleteComic}
          onNewComic={handleNewComic}
        />
        <main className="flex-grow h-full overflow-y-auto">
          <AnimatePresence mode="wait">
            {appState === 'landing' && (
              <motion.div 
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <LandingPage onCreateComic={handleCreateComic} error={error} />
              </motion.div>
            )}
            {appState === 'generating' && (
              <motion.div 
                key="generating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center"
              >
                <h2 className="text-3xl font-black uppercase text-csr-blue mb-4 animate-pulse">
                  {loadingMessage}
                </h2>
                <ForgingAnimation />
              </motion.div>
            )}
            {appState === 'viewing' && comicPanels.length > 0 && (
              <motion.div 
                key="viewer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ComicViewer
                  title={comicTitle}
                  coverImage={coverImage}
                  panels={comicPanels}
                  onReset={handleNewComic}
                  onUpdatePanelImage={handleUpdatePanel}
                  onUpdatePanelTransform={handleUpdateTransform}
                  onRetry={handleRetryPanel}
                  isGenerating={comicPanels.some(p => p.imageState === 'loading')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
    </div>
  );
}

export default App;