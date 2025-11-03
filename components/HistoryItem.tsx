import React from 'react';
import { motion } from 'framer-motion';
import type { ComicHistoryItem } from '../types';
import { Trash2, BookOpen } from './icons';

interface HistoryItemProps {
    item: ComicHistoryItem;
    onLoad: (id: string) => void;
    onDelete: (id: string) => void;
    isActive: boolean;
}

// FIX: Changed to React.FC to correctly handle React's special `key` prop and resolve TypeScript errors.
const HistoryItem: React.FC<HistoryItemProps> = ({ item, onLoad, onDelete, isActive }) => {
    
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${item.title}"? This cannot be undone.`)) {
            onDelete(item.id);
        }
    };

    return (
        <motion.div 
            className={`bg-csr-gray rounded-lg overflow-hidden border border-csr-light-gray/20 group relative cursor-pointer ${isActive ? 'border-csr-blue ring-2 ring-csr-blue' : ''}`}
            whileHover={{ scale: 1.03, zIndex: 10 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={() => onLoad(item.id)}
        >
            <div className="h-48 sm:h-64 w-full overflow-hidden">
                <img 
                    src={`data:image/png;base64,${item.coverImage}`} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-top"
                />
            </div>
            <div className="p-4">
                <h3 className="text-lg font-bold truncate text-white">{item.title}</h3>
                <p className="text-xs text-csr-light-gray">
                    {new Date(item.createdAt).toLocaleString()}
                </p>
            </div>
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => { e.stopPropagation(); onLoad(item.id); }}
                    className="flex items-center gap-2 bg-csr-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-500 transition-colors"
                >
                    <BookOpen className="w-5 h-5" /> View
                </button>
                <button 
                    onClick={handleDelete}
                    className="flex items-center gap-2 bg-csr-red text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors"
                >
                    <Trash2 className="w-5 h-5" /> Delete
                </button>
            </div>
        </motion.div>
    );
}

export default HistoryItem;