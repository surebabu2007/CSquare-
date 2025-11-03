import React from 'react';
import { motion } from 'framer-motion';
import type { ComicHistoryItem as ComicHistoryItemType } from '../types';
import HistoryItem from './HistoryItem';

interface HistoryBrowserProps {
    history: ComicHistoryItemType[];
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
}

function HistoryBrowser({ history, onLoad, onDelete }: HistoryBrowserProps) {
    return (
        <motion.div 
            className="mt-16 w-full max-w-6xl pb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
        >
            <h2 className="text-3xl font-black text-center text-white mb-8">PAST CREATIONS</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {history.map(item => (
                   <HistoryItem 
                     key={item.id}
                     item={item}
                     onLoad={onLoad}
                     onDelete={onDelete}
                     isActive={false} // Not relevant on landing page
                   />
                ))}
            </div>
        </motion.div>
    );
}

export default HistoryBrowser;
