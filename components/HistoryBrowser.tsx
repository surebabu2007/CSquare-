import React from 'react';
import { motion } from 'framer-motion';
import type { ComicHistoryItem } from '../types';
import { Trash2, BookOpen } from './icons';

interface HistoryBrowserProps {
    history: ComicHistoryItem[];
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
                    <motion.div 
                        key={item.id} 
                        className="bg-csr-gray rounded-lg overflow-hidden border border-csr-light-gray/20 group relative"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <img 
                            src={`data:image/png;base64,${item.coverImage}`} 
                            alt={item.title} 
                            className="w-full h-64 object-cover object-top"
                        />
                        <div className="p-4">
                            <h3 className="text-lg font-bold truncate text-white">{item.title}</h3>
                            <p className="text-xs text-csr-light-gray">
                                {new Date(item.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={() => onLoad(item.id)}
                                className="flex items-center gap-2 bg-csr-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors"
                            >
                                <BookOpen className="w-5 h-5" /> View
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                                className="flex items-center gap-2 bg-csr-red text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" /> Delete
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

export default HistoryBrowser;
