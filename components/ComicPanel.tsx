import React from 'react';
import { motion } from 'framer-motion';
import type { ComicPanelData } from '../types';
import type { AudioState } from '../App';
import { Edit3, Mic, Frame, Volume2 } from './icons';
import { Spinner } from './Spinner';

interface ComicPanelProps {
  panel: ComicPanelData;
  onEdit: () => void;
  onTalk: (character: string) => void;
  onAdjustFrame: () => void;
  onPlayAudio: (panelId: number, text: string, voiceSuggestion: string) => void;
  audioState: AudioState;
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


function ComicPanel({ panel, onEdit, onTalk, onAdjustFrame, onPlayAudio, audioState, className }: ComicPanelProps) {
  const isThisPanelLoadingAudio = audioState.isLoading && audioState.panelId === panel.id;
  const isThisPanelPlayingAudio = audioState.isPlaying && audioState.panelId === panel.id;

  return (
    <div className={`relative group bg-black border-4 border-white rounded-md shadow-lg overflow-hidden halftone-overlay ${className}`}>
        <motion.img 
            src={`data:image/png;base64,${panel.image}`} 
            alt={`Comic panel ${panel.id}`} 
            className="absolute top-0 left-0 w-full h-full object-cover"
            style={{
                scale: panel.transform?.scale ?? 1,
                x: panel.transform?.x ?? 0,
                y: panel.transform?.y ?? 0,
            }}
        />
        
        <SpeechBubble character={panel.character} dialogue={panel.dialogue} />
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-all duration-300 flex items-center justify-center flex-wrap gap-4 p-4">
          <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 bg-csr-blue text-white font-bold py-2 px-4 rounded-lg transform hover:scale-110">
            <Edit3 className="w-5 h-5" /> Edit
          </button>
           <button onClick={onAdjustFrame} className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 bg-green-500 text-white font-bold py-2 px-4 rounded-lg transform hover:scale-110">
            <Frame className="w-5 h-5" /> Frame
          </button>
          {panel.dialogue && (
              <button
                onClick={() => onPlayAudio(panel.id, panel.dialogue, panel.voiceSuggestion)}
                disabled={audioState.isLoading}
                className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 bg-purple-600 text-white font-bold py-2 px-4 rounded-lg transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isThisPanelLoadingAudio ? <Spinner/> : <Volume2 className="w-5 h-5" />}
                {isThisPanelPlayingAudio ? 'Stop' : 'Audio'}
              </button>
          )}
          {panel.character !== 'Narrator' && (
             <button onClick={() => onTalk(panel.character)} className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 bg-csr-red text-white font-bold py-2 px-4 rounded-lg transform hover:scale-110">
              <Mic className="w-5 h-5" /> Talk
            </button>
          )}
        </div>
    </div>
  );
}

export default ComicPanel;