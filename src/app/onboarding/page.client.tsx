'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, Sparkles, Trophy, Target, BarChart3, CheckCircle2, MapPin } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

// Dynamically import OrganicBackground with SSR disabled to avoid hydration issues
// (component uses Math.random() for organism generation)
const OrganicBackground = dynamic(
  () => import('@/components/animations/OrganicBackground').then(mod => ({ default: mod.OrganicBackground })),
  { ssr: false }
);

interface OnboardingClientProps {
  userId: string;
  userName: string;
  inatUsername: string;
  accessToken: string;
  observationCount: number;
  syncInProgress: boolean;
}

type Step = 'welcome' | 'features' | 'syncing' | 'complete';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: <Trophy className="w-12 h-12" />,
    title: 'Badges & Achievements',
    description: 'Unlock 40+ badges across 7 categories as you explore nature. From First Steps to Legend status, every milestone is celebrated.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: <Sparkles className="w-12 h-12" />,
    title: 'Earn XP for Every Observation',
    description: 'Every observation earns Experience Points (XP). New species, rare finds, and quality identifications earn bonus XP. Level up to unlock new titles!',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: <Sparkles className="w-12 h-12" />,
    title: 'Rarity Classification',
    description: 'Discover if your observations are Common, Rare, or Legendary! We analyze global and regional data to classify every species.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Target className="w-12 h-12" />,
    title: 'Quests & Challenges',
    description: 'Complete daily, weekly, and monthly quests. Seasonal challenges keep you engaged year-round.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <MapPin className="w-12 h-12" />,
    title: 'Trip Planning & Exploration',
    description: 'Plan nature trips with AI-powered location recommendations. Set target species, track discoveries, and earn trip achievements.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: <BarChart3 className="w-12 h-12" />,
    title: 'Advanced Statistics',
    description: 'Track your progress with detailed stats, life lists, observation streaks, and interactive charts.',
    color: 'from-green-500 to-cyan-500',
  },
];

export function OnboardingClient({
  userId,
  userName,
  inatUsername,
  accessToken,
  observationCount,
  syncInProgress,
}: OnboardingClientProps) {
  const [step, setStep] = useState<Step>(syncInProgress ? 'syncing' : 'welcome');
  const [currentFeature, setCurrentFeature] = useState(0);
  const [syncProgress, setSyncProgress] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(syncInProgress);
  const router = useRouter();

  // Auto-advance through features
  useEffect(() => {
    if (step === 'features') {
      const interval = setInterval(() => {
        setCurrentFeature((prev) => {
          if (prev < features.length - 1) {
            return prev + 1;
          } else {
            // All features shown, move to syncing
            setStep('syncing');
            startSync();
            return prev;
          }
        });
      }, 4000); // 4 seconds per feature

      return () => clearInterval(interval);
    }
    return undefined;
  }, [step]);

  // Poll sync progress
  useEffect(() => {
    if (step !== 'syncing' && !isSyncing) return;

    const pollProgress = async () => {
      try {
        const res = await fetch('/api/sync/progress');
        const data = await res.json();
        setSyncProgress(data);

        if (data.status === 'completed') {
          setStep('complete');
          // Mark onboarding as completed
          await fetch('/api/user/onboarding-complete', { method: 'POST' });
        } else if (data.status === 'error') {
          console.error('Sync failed:', data.error);
        }
      } catch (error) {
        console.error('Failed to poll progress:', error);
      }
    };

    const interval = setInterval(pollProgress, 2000);
    pollProgress(); // Initial poll

    return () => clearInterval(interval);
  }, [step, isSyncing]);

  const startSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, inatUsername, accessToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Sync API error:', error);
        // Show error to user
        alert(`Failed to start sync: ${error.error || 'Unknown error'}`);
        setIsSyncing(false);
        setStep('welcome'); // Go back to welcome screen
        return;
      }

      const result = await response.json();
      console.log('Sync started successfully:', result);
    } catch (error) {
      console.error('Failed to start sync:', error);
      alert('Failed to connect to sync service. Please try again.');
      setIsSyncing(false);
      setStep('welcome'); // Go back to welcome screen
    }
  };

  const handleGetStarted = () => {
    setStep('features');
  };

  const handleSkipToSync = () => {
    setStep('syncing');
    startSync();
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-nature-900 via-nature-800 to-nature-900 overflow-hidden relative">
      {/* Organic life background animation */}
      <OrganicBackground />

      <AnimatePresence mode="wait">
        {/* Step 1: Welcome */}
        {step === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-8"
          >
            <div className="max-w-2xl text-center text-white space-y-8 relative">
              {/* Ambient glow effect behind logo */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.3, scale: 1.2 }}
                transition={{ delay: 0.1, duration: 1 }}
                className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-nature-400 rounded-full blur-3xl"
              />

              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', duration: 0.8 }}
                className="flex justify-center relative z-10"
              >
                <Image
                  src="/images/logo-transparent.png"
                  alt="BioQuest Logo"
                  width={160}
                  height={160}
                  priority
                  className="drop-shadow-2xl"
                />
              </motion.div>

              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-5xl md:text-6xl font-bold"
              >
                Welcome to BioQuest, {userName}!
              </motion.h1>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xl md:text-2xl text-nature-100"
              >
                Let's transform your {observationCount.toLocaleString()} iNaturalist observations
                into an epic adventure
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="space-y-4"
              >
                <p className="text-nature-200">
                  This will take about {Math.ceil(observationCount / 1000) * 6} minutes to import and classify your observations.
                </p>

                <p className="text-lg font-semibold text-white">You'll unlock:</p>
                <div className="flex flex-wrap justify-center gap-4 text-nature-100">
                  <span>✨ Rarity classifications</span>
                  <span>🏆 Badges & achievements</span>
                  <span>📊 Advanced statistics</span>
                  <span>🎯 Personalized quests</span>
                  <span>🗺️ Trip planning</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Button
                  size="lg"
                  onClick={handleGetStarted}
                  className="bg-nature-500 hover:bg-nature-600 text-white px-12 py-6 text-lg"
                >
                  Let's Begin
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Features Showcase */}
        {step === 'features' && (
          <motion.div
            key="features"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex items-center justify-center p-8"
          >
            <div className="max-w-3xl w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentFeature}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="text-center text-white space-y-8"
                >
                  <div className={`inline-flex p-6 rounded-full bg-gradient-to-br ${features[currentFeature].color}`}>
                    {features[currentFeature].icon}
                  </div>

                  <h2 className="text-4xl md:text-5xl font-bold">
                    {features[currentFeature].title}
                  </h2>

                  <p className="text-xl text-nature-100 max-w-2xl mx-auto">
                    {features[currentFeature].description}
                  </p>

                  {/* Progress dots */}
                  <div className="flex justify-center gap-2 pt-8">
                    {features.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all ${
                          i === currentFeature
                            ? 'w-8 bg-white'
                            : i < currentFeature
                            ? 'w-2 bg-nature-400'
                            : 'w-2 bg-nature-600'
                        }`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleSkipToSync}
                    className="text-nature-200 hover:text-white"
                  >
                    Skip to import
                  </Button>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Step 3: Immersive Sync Progress */}
        {step === 'syncing' && (
          <ImmersiveSyncProgress progress={syncProgress} userName={userName} />
        )}

        {/* Step 4: Epic Completion */}
        {step === 'complete' && (
          <EpicCompletion
            observationCount={observationCount}
            onContinue={handleGoToDashboard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ImmersiveSyncProgress({ progress, userName }: { progress: any; userName: string }) {
  const [currentFunnyMessage, setCurrentFunnyMessage] = useState(progress?.funnyMessage || '');

  const percentage = progress?.observationsTotal > 0
    ? Math.round((progress.observationsProcessed / progress.observationsTotal) * 100)
    : 0;

  const phaseLabels = {
    fetching: 'Fetching observations from iNaturalist',
    enriching: 'Classifying rarity and calculating points',
    storing: 'Saving to your profile',
    calculating: 'Computing statistics and achievements',
    done: 'Complete!',
  };

  // Update funny message when it changes, triggering animation
  useEffect(() => {
    if (progress?.funnyMessage && progress.funnyMessage !== currentFunnyMessage) {
      setCurrentFunnyMessage(progress.funnyMessage);
    }
  }, [progress?.funnyMessage]);

  return (
    <motion.div
      key="syncing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-nature-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl w-full text-center text-white space-y-8 z-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-20 h-20 mx-auto text-nature-400" />
        </motion.div>

        <h2 className="text-3xl md:text-4xl font-bold">
          Importing Your Naturalist Journey
        </h2>

        <div className="space-y-4">
          <div className="text-6xl font-bold text-nature-300">
            {percentage}%
          </div>

          <Progress value={percentage} className="h-4 bg-nature-700" />

          <p className="text-xl text-nature-100">
            {progress?.observationsProcessed || 0} / {progress?.observationsTotal || 0} observations
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-lg font-semibold text-nature-200">
            {progress?.message || 'Starting sync...'}
          </p>
        </div>

        {progress?.estimatedTimeRemaining && progress.estimatedTimeRemaining > 5 && (
          <p className="text-nature-400">
            Est. {Math.floor(progress.estimatedTimeRemaining / 60)}m{' '}
            {Math.round(progress.estimatedTimeRemaining % 60)}s remaining
          </p>
        )}

        {/* Rotating funny message with animation */}
        <AnimatePresence mode="wait">
          {currentFunnyMessage && (
            <motion.p
              key={currentFunnyMessage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-base text-nature-400 pt-8 italic"
            >
              {currentFunnyMessage}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function EpicCompletion({
  observationCount,
  onContinue,
}: {
  observationCount: number;
  onContinue: () => void;
}) {
  return (
    <motion.div
      key="complete"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden"
    >
      {/* Confetti effect */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10%`,
              backgroundColor: ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][
                Math.floor(Math.random() * 5)
              ],
            }}
            animate={{
              y: ['0vh', '110vh'],
              rotate: [0, 360],
              opacity: [1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              repeat: Infinity,
            }}
          />
        ))}
      </div>

      <div className="max-w-2xl text-center text-white space-y-8 z-10">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <CheckCircle2 className="w-32 h-32 mx-auto text-green-400" />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-5xl md:text-6xl font-bold"
        >
          🎉 You're All Set!
        </motion.h1>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <p className="text-2xl text-nature-100">
            Successfully imported {observationCount.toLocaleString()} observations
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-nature-800/50 rounded-lg p-6 border border-nature-600">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-lg font-semibold">Badges Unlocked</div>
              <div className="text-nature-300">Check your achievements</div>
            </div>

            <div className="bg-nature-800/50 rounded-lg p-6 border border-nature-600">
              <div className="text-4xl mb-2">✨</div>
              <div className="text-lg font-semibold">Rare Finds</div>
              <div className="text-nature-300">Discover your legendary species</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            size="lg"
            onClick={onContinue}
            className="bg-nature-500 hover:bg-nature-600 text-white px-12 py-6 text-lg"
          >
            Explore Your Dashboard
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
