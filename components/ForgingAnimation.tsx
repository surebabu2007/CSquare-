
import React from 'react';
// FIX: Imported Variants type from framer-motion.
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Hammer, Anvil } from './icons';

// FIX: Added a global declaration for the `lucide` object on the window to resolve TypeScript errors.
declare global {
  interface Window {
    lucide?: {
      createIcons: () => void;
    };
  }
}

// FIX: Explicitly typed sparkVariants with Variants to resolve type incompatibility with the 'ease' property in transitions.
const sparkVariants: Variants = {
  initial: {
    opacity: 1,
    scale: 0,
    x: 0,
    y: 0,
  },
  animate: (i: number) => {
    const angle = (i / 8) * 2 * Math.PI + (Math.random() - 0.5) * 0.5;
    const radius = 50 + Math.random() * 40;
    return {
      opacity: [1, 1, 0],
      scale: [0, 1.2, 0],
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      transition: {
        duration: 0.6 + Math.random() * 0.4,
        ease: "easeOut",
      },
    }
  },
};

const Sparks = ({ trigger }: { trigger: number }) => {
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <motion.div key={trigger} className="absolute">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              variants={sparkVariants}
              initial="initial"
              animate="animate"
              custom={i}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export function ForgingAnimation() {
  const [sparkTrigger, setSparkTrigger] = React.useState(0);

  React.useEffect(() => {
    // Manually trigger lucide replacement for the new icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <Anvil className="w-24 h-24 text-csr-light-gray absolute bottom-10" />

      <motion.div
        className="absolute top-0"
        animate={{
          y: [0, 60, 0],
          rotate: [20, -45, 20],
        }}
        transition={{
          duration: 1.2,
          ease: "easeInOut",
          repeat: Infinity,
          times: [0, 0.5, 1],
        }}
        onAnimationIteration={() => {
          setSparkTrigger(prev => prev + 1);
        }}
      >
        <Hammer className="w-20 h-20 text-white" />
      </motion.div>
      
      <div className="absolute" style={{ top: 'calc(50% + 20px)'}}>
        <Sparks trigger={sparkTrigger} />
      </div>

    </div>
  );
}
