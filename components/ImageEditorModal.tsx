
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ComicPanelData, ImagePart } from '../types';
import { editImage } from '../services/geminiService';
import { Spinner } from './Spinner';
import { X } from './icons';

interface ImageEditorModalProps {
  panel: ComicPanelData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newImage: string) => void;
}

function ImageEditorModal({ panel, isOpen, onClose, onSave }: ImageEditorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt || !panel) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const imagePart: ImagePart = {
        data: panel.image,
        mimeType: 'image/png', // Assuming png, can be improved
      };
      const newImage = await editImage(imagePart, prompt);
      onSave(newImage);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to edit image.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && panel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            className="bg-csr-gray rounded-lg shadow-xl w-full max-w-2xl border border-csr-light-gray/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-csr-blue">Edit Panel Image</h2>
                <button onClick={onClose} className="text-csr-light-gray hover:text-white">
                  <X className="w-6 h-6"/>
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <img src={`data:image/png;base64,${panel.image}`} alt="Current panel" className="rounded-md w-full" />
                </div>
                <form onSubmit={handleSubmit} className="w-full md:w-1/2 flex flex-col justify-between">
                  <div>
                    <label htmlFor="edit-prompt" className="block text-sm font-medium text-white mb-2">Describe your edit:</label>
                    <textarea
                      id="edit-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., Add a retro filter, make it nighttime..."
                      rows={4}
                      className="w-full bg-csr-dark border border-csr-light-gray/50 text-white rounded-lg p-2.5 focus:ring-csr-blue focus:border-csr-blue"
                      disabled={isLoading}
                    />
                  </div>
                  {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                  <button type="submit" disabled={isLoading || !prompt} className="mt-4 w-full bg-csr-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                    {isLoading ? <Spinner /> : 'Generate Edit'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ImageEditorModal;