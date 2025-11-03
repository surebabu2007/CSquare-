import React from 'react';
import { motion } from 'framer-motion';
import type { ComicPanelData } from '../types';
import { Edit3, Frame, RefreshCw } from './icons';
import { Spinner } from './Spinner';

interface ComicPanelProps {
  panel: ComicPanelData;
  onEdit: () => void;
  onAdjustFrame: () => void;
  onRetry: (panelId: number) => void;
  className?: string;
}

interface SpeechBubbleProps {
    character: string;
    dialogue: string;
}

function SpeechBubble({ character, dialogue }: SpeechBubbleProps) {
    if (!dialogue) return null;

    if (character === 'Narrator') {
        return (
            <div className="absolute top-0 left-0 right-0 p-3 bg-yellow-400 text-black font-comic tracking-wide text-lg text-center shadow-md">
                <p>{dialogue}</p>
            </div>
        );
    }

    return (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
            <div className="relative bg-white text-black p-4 rounded-xl shadow-lg max-w-[90%]">
                <p className="font-comic tracking-wider text-2xl">
                    <span className="font-sans font-bold text-sm uppercase">{character}:</span> {dialogue}
                </p>
                <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-t-[15px] border-t-white border-r-[10px] border-r-transparent"></div>
            </div>
        </div>
    );
}


// FIX: Changed to React.FC to correctly handle React's special `key` prop and resolve TypeScript errors.
const ComicPanel: React.FC<ComicPanelProps> = ({ panel, onEdit, onAdjustFrame, onRetry, className }) => {
  const { image, imageState = 'loaded' } = panel;

  return (
    <div className={`relative group bg-black border-4 border-white rounded-md shadow-lg overflow-hidden halftone-overlay ${className}`}>
      {imageState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
          <Spinner />
          <p className="text-csr-light-gray text-sm">Rendering Panel...</p>
        </div>
      )}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/80 gap-4 p-4 text-center">
          <p className="text-white font-bold">Generation Failed</p>
          <button onClick={() => onRetry(panel.id)} className="flex items-center gap-2 bg-csr-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors">
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
        </div>
      )}
      {imageState === 'loaded' && image && (
        <motion.img 
            src={`data:image/png;base64,${image}`} 
            alt={`Comic panel ${panel.id}`} 
            className="absolute top-0 left-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                scale: panel.transform?.scale ?? 1,
                x: panel.transform?.x ?? 0,
                y: panel.transform?.y ?? 0,
                rotate: panel.transform?.rotation ?? 0,
            }}
        />
      )}
        
      {imageState === 'loaded' && (
        <>
          <SpeechBubble character={panel.character} dialogue={panel.dialogue} />
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center flex-wrap gap-4 p-4">
            <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 bg-csr-blue text-white font-bold py-2 px-4 rounded-lg transform hover:scale-110">
              <Edit3 className="w-5 h-5" /> Edit
            </button>
            <button onClick={onAdjustFrame} className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg transform hover:scale-110">
              <Frame className="w-5 h-5" /> Frame
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ComicPanel;