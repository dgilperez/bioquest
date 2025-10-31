'use client';

import { LeaderboardEntry } from '@/lib/leaderboards/service';
import Image from 'next/image';
import { CountUp } from '@/components/animations/CountUp';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  points: number;
  isCurrentUser: boolean;
  index: number;
}

export function LeaderboardRow({ entry, points, isCurrentUser, index }: LeaderboardRowProps) {
  const reducedMotion = useReducedMotion();

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  const medal = getMedalEmoji(entry.rank);

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : {
              delay: index * 0.05,
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }
      }
      whileHover={reducedMotion ? {} : { scale: 1.01, x: 4 }}
      className={`
        px-6 py-4 transition-all relative overflow-hidden
        ${isCurrentUser ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-800/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}
      `}
    >
      {/* Current user highlight pulse */}
      {isCurrentUser && (
        <>
          <motion.div
            className="absolute inset-0 bg-green-400/10"
            animate={
              reducedMotion
                ? { opacity: 0.15 }
                : {
                    opacity: [0.1, 0.2, 0.1],
                  }
            }
            transition={
              reducedMotion
                ? { duration: 0 }
                : {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          />
          {/* Spotlight effect */}
          <motion.div
            className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"
            initial={reducedMotion ? { scaleY: 1 } : { scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { delay: index * 0.05 + 0.2, duration: 0.3 }
            }
          />
        </>
      )}

      <div className="grid grid-cols-12 gap-4 items-center relative z-10">
        {/* Rank with medal animation */}
        <div className="col-span-1">
          <div className="flex items-center gap-2">
            {medal ? (
              <motion.span
                className="text-2xl inline-block"
                initial={
                  reducedMotion ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }
                }
                animate={{ scale: 1, rotate: 0 }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : {
                        delay: index * 0.05 + 0.1,
                        type: 'spring',
                        stiffness: 260,
                        damping: 20,
                      }
                }
                whileHover={
                  reducedMotion
                    ? {}
                    : {
                        scale: 1.2,
                        rotate: [0, -10, 10, -10, 0],
                        transition: { duration: 0.5 },
                      }
                }
              >
                {medal}
              </motion.span>
            ) : (
              <motion.span
                initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  reducedMotion ? { duration: 0 } : { delay: index * 0.05 + 0.1 }
                }
                className="text-lg font-semibold text-gray-700 dark:text-gray-300"
              >
                #{entry.rank}
              </motion.span>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="col-span-5">
          <div className="flex items-center gap-3">
            {/* Avatar with fade-in */}
            <motion.div
              initial={
                reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }
              }
              animate={{ opacity: 1, scale: 1 }}
              transition={
                reducedMotion
                  ? { duration: 0 }
                  : {
                      delay: index * 0.05 + 0.15,
                      type: 'spring',
                      stiffness: 300,
                    }
              }
            >
              {entry.user.icon ? (
                <Image
                  src={entry.user.icon}
                  alt={entry.user.name || entry.user.inatUsername}
                  width={40}
                  height={40}
                  className="rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nature-400 to-nature-600 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                  <span className="text-white text-sm font-semibold">
                    {(entry.user.name || entry.user.inatUsername).charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </motion.div>

            <motion.div
              className="min-w-0"
              initial={reducedMotion ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={
                reducedMotion ? { duration: 0 } : { delay: index * 0.05 + 0.2 }
              }
            >
              <div className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {entry.user.name || entry.user.inatUsername}
                {isCurrentUser && (
                  <motion.span
                    initial={reducedMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : {
                            delay: index * 0.05 + 0.4,
                            type: 'spring',
                          }
                    }
                    className="ml-2 text-xs font-normal text-green-600 dark:text-green-400"
                  >
                    (You)
                  </motion.span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                @{entry.user.inatUsername}
                {entry.user.location && (
                  <span className="ml-2">• {entry.user.location}</span>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* Points with count-up */}
        <motion.div
          className="col-span-2 text-right"
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion ? { duration: 0 } : { delay: index * 0.05 + 0.25 }
          }
        >
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            <CountUp value={points} duration={1000 + index * 50} />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Level {entry.level}
          </div>
        </motion.div>

        {/* Observations with count-up */}
        <motion.div
          className="col-span-2 text-right"
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion ? { duration: 0 } : { delay: index * 0.05 + 0.3 }
          }
        >
          <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
            <CountUp value={entry.totalObservations} duration={1000 + index * 50} />
          </div>
        </motion.div>

        {/* Species with count-up */}
        <motion.div
          className="col-span-2 text-right"
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reducedMotion ? { duration: 0 } : { delay: index * 0.05 + 0.35 }
          }
        >
          <div className="text-base font-semibold text-gray-700 dark:text-gray-300">
            <CountUp value={entry.totalSpecies} duration={1000 + index * 50} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
