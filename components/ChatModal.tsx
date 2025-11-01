
import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLiveChat } from '../hooks/useLiveChat';
import { Mic, MicOff, X } from './icons';

interface ChatModalProps {
  character: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function ChatModal({ character, isOpen, onClose }: ChatModalProps) {
  const { startChat, stopChat, isConnected, isSpeaking, isProcessing, transcript } = useLiveChat(character || 'a racer');

  useEffect(() => {
    if (isOpen) {
      startChat();
    } else {
      stopChat();
    }
  }, [isOpen, startChat, stopChat]);
  
  function handleClose() {
    stopChat();
    onClose();
  }

  return (
    <AnimatePresence>
      {isOpen && character && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="bg-csr-gray rounded-lg shadow-xl w-full max-w-md border border-csr-light-gray/20 flex flex-col"
            style={{height: '80vh', maxHeight: '600px'}}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-4 border-b border-csr-light-gray/20 flex justify-between items-center">
              <h2 className="text-xl font-bold text-csr-blue">Talk to {character}</h2>
              <button onClick={handleClose} className="text-csr-light-gray hover:text-white">
                <X className="w-6 h-6"/>
              </button>
            </header>

            <main className="p-4 flex-grow overflow-y-auto space-y-4">
              {transcript.map((t, i) => (
                <div key={i}>
                  {t.user && <p className="text-right text-white"><span className="bg-csr-blue/80 rounded-lg px-3 py-1 inline-block">{t.user}</span></p>}
                  {t.model && <p className="text-left text-white mt-1"><span className="bg-csr-dark rounded-lg px-3 py-1 inline-block">{t.model}</span></p>}
                </div>
              ))}
            </main>

            <footer className="p-4 border-t border-csr-light-gray/20 text-center">
              {isProcessing ? (
                <p className="text-csr-light-gray animate-pulse">Connecting...</p>
              ) : isConnected ? (
                <div className="flex flex-col items-center">
                   <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isSpeaking ? 'bg-csr-red animate-pulse' : 'bg-csr-blue'}`}>
                     <Mic className="w-8 h-8 text-white"/>
                   </div>
                   <p className="text-csr-light-gray mt-2">{isSpeaking ? `${character} is speaking...` : 'Listening...'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                   <div className="w-16 h-16 rounded-full flex items-center justify-center bg-csr-light-gray">
                     <MicOff className="w-8 h-8 text-csr-dark"/>
                   </div>
                   <p className="text-csr-light-gray mt-2">Disconnected</p>
                </div>
              )}
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ChatModal;