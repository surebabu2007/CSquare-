import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import type { ComicPanelData } from '../types';
import { X } from './icons';

interface FrameAdjusterModalProps {
  panel: ComicPanelData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTransform: { x: number; y: number; scale: number; rotation: number }) => void;
}

function FrameAdjusterModal({ panel, isOpen, onClose, onSave }: FrameAdjusterModalProps) {
  const [scale, setScale] = useState(panel?.transform?.scale ?? 1);
  const [rotation, setRotation] = useState(panel?.transform?.rotation ?? 0);
  const x = useMotionValue(panel?.transform?.x ?? 0);
  const y = useMotionValue(panel?.transform?.y ?? 0);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  useEffect(() => {
    if (panel) {
      const initialTransform = panel.transform ?? { scale: 1, x: 0, y: 0, rotation: 0 };
      setScale(initialTransform.scale);
      setRotation(initialTransform.rotation ?? 0);
      x.set(initialTransform.x);
      y.set(initialTransform.y);
    }
  }, [panel, x, y]);
  
  useEffect(() => {
    if (viewportRef.current) {
        const viewportSize = viewportRef.current.offsetWidth;
        const scaledSize = viewportSize * scale;
        // Approximate overspill for rotation. This is not perfect but prevents large gaps.
        const rotationMargin = scaledSize * (Math.sqrt(2) - 1) / 2; 
        const overspill = Math.max(0, scaledSize - viewportSize) / 2 + rotationMargin;
        
        const newConstraints = {
            left: -overspill,
            right: overspill,
            top: -overspill,
            bottom: overspill,
        };
        setDragConstraints(newConstraints);
        
        // Clamp existing position within new constraints
        x.set(Math.max(newConstraints.left, Math.min(x.get(), newConstraints.right)));
        y.set(Math.max(newConstraints.top, Math.min(y.get(), newConstraints.bottom)));
    }
  }, [scale, rotation, x, y]);


  function handleSave() {
    onSave({ scale, rotation, x: x.get(), y: y.get() });
  }
  
  function handleReset() {
      setScale(1);
      setRotation(0);
      x.set(0);
      y.set(0);
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
                <h2 className="text-2xl font-bold text-csr-blue">Adjust Panel Frame</h2>
                <button onClick={onClose} className="text-csr-light-gray hover:text-white">
                  <X className="w-6 h-6"/>
                </button>
              </div>
              
              <div ref={viewportRef} className="relative w-full max-w-lg mx-auto aspect-square bg-black border-2 border-csr-light-gray/50 rounded-md overflow-hidden cursor-grab active:cursor-grabbing">
                <motion.img
                  src={`data:image/png;base64,${panel.image}`}
                  alt="Adjustable panel"
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  style={{ scale, x, y, rotate: rotation }}
                  drag
                  dragConstraints={dragConstraints}
                  dragTransition={{ bounceStiffness: 100, bounceDamping: 20 }}
                />
              </div>

              <div className="mt-6 max-w-lg mx-auto space-y-4">
                <div>
                  <label htmlFor="zoom" className="block text-sm font-medium text-white mb-2">Zoom ({scale.toFixed(2)}x)</label>
                  <input
                    id="zoom"
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full h-2 bg-csr-dark rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label htmlFor="rotation" className="block text-sm font-medium text-white mb-2">Rotation ({rotation.toFixed(0)}°)</label>
                  <input
                    id="rotation"
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(parseFloat(e.target.value))}
                    className="w-full h-2 bg-csr-dark rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center max-w-lg mx-auto">
                <button onClick={handleReset} className="bg-transparent text-csr-light-gray font-bold py-2 px-4 rounded-lg hover:bg-csr-light-gray/20 transition-colors">
                  Reset
                </button>
                <div className="flex gap-4">
                  <button onClick={onClose} className="bg-csr-light-gray/50 text-white font-bold py-2 px-4 rounded-lg hover:bg-csr-light-gray/80 transition-colors">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="bg-csr-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    Save Frame
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FrameAdjusterModal;
