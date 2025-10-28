'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { pointsPopup } from '@/lib/animations/variants';

interface FloatingPointsProps {
  points: number;
  show: boolean;
  onComplete?: () => void;
}

export function FloatingPoints({ points, show, onComplete }: FloatingPointsProps) {
  return (
    <AnimatePresence onExitComplete={onComplete}>
      {show && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 z-50"
          variants={pointsPopup}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <div className="font-display text-3xl font-bold text-nature-600 drop-shadow-lg">
            +{points} XP
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
