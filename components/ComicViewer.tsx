import React, { useState } from 'react';
import type { ComicPanelData } from '../types';
import type { AudioState } from '../App';
import { AnimatePresence, motion } from 'framer-motion';
import ComicPage from './ComicPage';
import ImageEditorModal from './ImageEditorModal';
import ChatModal from './ChatModal';
import FrameAdjusterModal from './FrameAdjusterModal';
import { Download, RefreshCw, FileArchive, BookOpen } from './icons';

// Add declarations for CDN libraries to avoid TypeScript errors
declare global {
  interface Window {
    html2canvas: any;
    JSZip: any;
  }
}

interface ComicViewerProps {
  title: string;
  coverImage: string;
  panels: ComicPanelData[];
  onReset: () => void;
  onUpdatePanelImage: (panelId: number, newImage: string) => void;
  onUpdatePanelTransform: (panelId: number, newTransform: { x: number; y: number; scale: number }) => void;
  onPlayAudio: (panelId: number, text: string, voiceSuggestion: string) => void;
  audioState: AudioState;
}

// Helper to group panels into pages for a better layout
function groupPanelsIntoPages(panels: ComicPanelData[]): ComicPanelData[][] {
    const pages: ComicPanelData[][] = [];
    let i = 0;
    while (i < panels.length) {
        // For 15 panels, this creates 5 pages of 3 panels each.
        pages.push(panels.slice(i, i + 3));
        i += 3;
    }
    return pages;
}


function ComicViewer({ title, coverImage, panels, onReset, onUpdatePanelImage, onUpdatePanelTransform, onPlayAudio, audioState }: ComicViewerProps) {
  const [editingPanel, setEditingPanel] = useState<ComicPanelData | null>(null);
  const [adjustingPanel, setAdjustingPanel] = useState<ComicPanelData | null>(null);
  const [chattingCharacter, setChattingCharacter] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<'idle' | 'page' | 'frames'>('idle');
  const [showCover, setShowCover] = useState(false);

  const pages = groupPanelsIntoPages(panels);
  const isDownloading = downloadState !== 'idle';

  const handleDownloadPage = async () => {
    setDownloadState('page');
    try {
      const comicMainElement = document.getElementById('comic-main-content');
      if (comicMainElement) {
        const canvas = await window.html2canvas(comicMainElement, {
          scale: 2, // for high quality
          backgroundColor: '#101010', // match the page background
          useCORS: true,
          logging: false,
        });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `${title.replace(/\s+/g, '_')}-comic.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Failed to download page:", error);
      alert("Sorry, there was an error downloading the comic page.");
    } finally {
      setDownloadState('idle');
    }
  };

  const handleDownloadFrames = async () => {
    setDownloadState('frames');
    try {
      const zip = new window.JSZip();
      panels.forEach(panel => {
        zip.file(`panel_${panel.id}.png`, panel.image, { base64: true });
      });
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${title.replace(/\s+/g, '_')}-frames.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to download frames:", error);
      alert("Sorry, there was an error creating the zip file.");
    } finally {
      setDownloadState('idle');
    }
  };


  return (
    <>
      <div className="min-h-screen bg-csr-dark p-4 sm:p-6 md:p-8 font-sans">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 text-center sm:text-left max-w-7xl mx-auto">
          <motion.h1 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black uppercase text-white tracking-wider mb-4 sm:mb-0"
          >
            {title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 sm:space-x-4 flex-wrap justify-center"
          >
            <button onClick={() => setShowCover(!showCover)} disabled={isDownloading} className="flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50">
              <BookOpen className="w-5 h-5"/> {showCover ? 'Hide Cover' : 'Show Cover'}
            </button>
            <button onClick={handleDownloadPage} disabled={isDownloading} className="flex items-center gap-2 bg-csr-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-wait">
              <Download className="w-5 h-5"/> {downloadState === 'page' ? 'Processing...' : 'Download Page'}
            </button>
            <button onClick={handleDownloadFrames} disabled={isDownloading} className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-wait">
              <FileArchive className="w-5 h-5"/> {downloadState === 'frames' ? 'Zipping...' : 'Download Frames'}
            </button>
            <button onClick={onReset} disabled={isDownloading} className="flex items-center gap-2 bg-csr-gray text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50">
              <RefreshCw className="w-5 h-5"/> Start Over
            </button>
          </motion.div>
        </header>
        
        <main id="comic-main-content" className="flex flex-col items-center gap-12">
          <AnimatePresence>
            {showCover && coverImage && (
              <motion.div
                key="cover"
                initial={{ opacity: 0, y: -50, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -50, height: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-2xl mx-auto"
              >
                <div className="relative shadow-2xl shadow-black/50">
                  <img src={`data:image/png;base64,${coverImage}`} alt={`${title} - Comic Cover`} className="w-full rounded-lg border-4 border-white" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/50 rounded-md"></div>
                  <h2 className="absolute bottom-6 left-6 right-6 text-center text-4xl lg:text-5xl font-comic text-white" style={{textShadow: '2px 2px 8px rgba(0,0,0,0.9)'}}>{title}</h2>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {pages.map((pagePanels, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="w-full max-w-7xl"
            >
              <ComicPage 
                panels={pagePanels} 
                onEdit={setEditingPanel}
                onTalk={setChattingCharacter}
                onAdjustFrame={setAdjustingPanel}
                onPlayAudio={onPlayAudio}
                audioState={audioState}
              />
            </motion.div>
          ))}
        </main>
      </div>
      
      <ImageEditorModal 
        panel={editingPanel}
        isOpen={!!editingPanel}
        onClose={() => setEditingPanel(null)}
        onSave={(newImage) => {
          if (editingPanel) {
            onUpdatePanelImage(editingPanel.id, newImage);
            setEditingPanel(null);
          }
        }}
      />
      
      <ChatModal
        character={chattingCharacter}
        isOpen={!!chattingCharacter}
        onClose={() => setChattingCharacter(null)}
      />

      <FrameAdjusterModal
        panel={adjustingPanel}
        isOpen={!!adjustingPanel}
        onClose={() => setAdjustingPanel(null)}
        onSave={(newTransform) => {
          if (adjustingPanel) {
            onUpdatePanelTransform(adjustingPanel.id, newTransform);
            setAdjustingPanel(null);
          }
        }}
      />
    </>
  );
}

export default ComicViewer;
