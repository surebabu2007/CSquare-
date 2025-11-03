import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ComicHistoryItem as ComicHistoryItemType } from '../types';
import { X } from './icons';
import HistoryItem from './HistoryItem';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: ComicHistoryItemType[];
  activeComicId: string | null;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
}

const sidebarVariants = {
  closed: { x: '100%' },
  open: { x: 0 },
};

function HistorySidebar({ isOpen, onClose, history, activeComicId, onLoad, onDelete }: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.div
            variants={sidebarVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-csr-gray shadow-2xl z-50 flex flex-col border-l-2 border-csr-blue"
          >
            <header className="flex justify-between items-center p-4 border-b border-csr-light-gray/20">
              <h2 className="text-2xl font-bold text-white">Comic History</h2>
              <button onClick={onClose} className="text-csr-light-gray hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </header>
            <div className="flex-grow p-4 overflow-y-auto">
              {history.length > 0 ? (
                <div className="space-y-4">
                  {history.map(item => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onLoad={onLoad}
                      onDelete={onDelete}
                      isActive={item.id === activeComicId}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-csr-light-gray">
                  <p>No past comics found.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default HistorySidebar;
