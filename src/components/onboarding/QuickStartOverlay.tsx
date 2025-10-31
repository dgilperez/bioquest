'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Target, Map, ChevronRight, ChevronLeft } from 'lucide-react';

interface QuickStartOverlayProps {
  show: boolean;
  onClose: () => void;
}

interface Step {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
}

const steps: Step[] = [
  {
    title: 'Understanding XP',
    description: 'Learn how you earn experience points and level up',
    icon: <Sparkles className="h-12 w-12 text-nature-600" />,
    details: [
      'Earn XP for every observation you make',
      'Get bonus XP for new species, rare finds, and research-grade observations',
      'Click the help icon (?) on your level card or "Learn more" to see the full XP guide',
      'Track your weekly XP in the golden card on your dashboard',
    ],
  },
  {
    title: 'Complete Quests',
    description: 'Take on daily, weekly, and monthly challenges',
    icon: <Target className="h-12 w-12 text-purple-600" />,
    details: [
      'Find daily quests for quick XP boosts',
      'Complete weekly challenges for bigger rewards',
      'Track your progress on each quest',
      'Visit the Quests page to see all active challenges',
    ],
  },
  {
    title: 'Plan Your Trips',
    description: 'Discover new locations and maximize your observations',
    icon: <Map className="h-12 w-12 text-blue-600" />,
    details: [
      'Use the Explore page to plan trips to biodiversity hotspots',
      'See potential species and XP rewards for each location',
      'Discover rare species in your area',
      'Track which locations you\'ve visited',
    ],
  },
];

export function QuickStartOverlay({ show, onClose }: QuickStartOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-nature-600 to-nature-700 p-4 sm:p-6 text-white">
                <button
                  onClick={handleSkip}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/20 p-3 rounded-full">
                    🌿
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold">Welcome to BioQuest!</h2>
                    <p className="text-sm opacity-90 font-body">Let&apos;s get you started</p>
                  </div>
                </div>

                {/* Progress Dots */}
                <div className="flex gap-2 mt-4">
                  {steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        index === currentStep
                          ? 'bg-white'
                          : index < currentStep
                          ? 'bg-white/70'
                          : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 200,
                          damping: 15,
                          delay: 0.1,
                        }}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-full"
                      >
                        {steps[currentStep].icon}
                      </motion.div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-center mb-3 text-gray-900 dark:text-gray-100">
                      {steps[currentStep].title}
                    </h3>
                    <p className="text-center text-sm sm:text-base text-muted-foreground mb-6 font-body">
                      {steps[currentStep].description}
                    </p>

                    {/* Details */}
                    <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                      {steps[currentStep].details.map((detail, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                          className="flex gap-3"
                        >
                          <div className="mt-1 flex-shrink-0">
                            <div className="h-2 w-2 rounded-full bg-nature-600" />
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 font-body">
                            {detail}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-800 p-4 sm:p-6 flex items-center justify-between gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-display font-semibold transition-colors min-h-[44px] touch-manipulation ${
                    currentStep === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="text-xs sm:text-sm text-muted-foreground font-body">
                  {currentStep + 1} of {steps.length}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 bg-nature-600 hover:bg-nature-700 text-white rounded-lg font-display font-semibold transition-colors min-h-[44px] touch-manipulation"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <span className="hidden sm:inline">Get Started</span>
                      <span className="sm:hidden">Start</span>
                      <Sparkles className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
