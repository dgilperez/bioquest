'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SyncIndicatorProps {
  isVisible: boolean;
}

export function SyncIndicator({ isVisible }: SyncIndicatorProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
    } else {
      // Delay hiding to show completion state
      const timeout = setTimeout(() => setShow(false), 1000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [isVisible]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 right-4 z-50 bg-nature-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          {isVisible ? (
            <>
              <motion.div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <span className="text-sm font-medium">Syncing...</span>
            </>
          ) : (
            <>
              <span className="text-lg">✓</span>
              <span className="text-sm font-medium">Synced</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
