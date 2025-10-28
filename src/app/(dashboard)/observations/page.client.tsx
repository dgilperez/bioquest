'use client';

import { motion } from 'framer-motion';
import { Observation } from '@prisma/client';
import { AnimatedObservationCard } from '@/components/observations/AnimatedObservationCard';
import { staggerContainer } from '@/lib/animations/variants';

interface ObservationsClientProps {
  observations: Observation[];
  hasObservations: boolean;
}

export function ObservationsClient({ observations, hasObservations }: ObservationsClientProps) {
  if (observations.length > 0) {
    return (
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {observations.map((observation, index) => (
          <AnimatedObservationCard
            key={observation.id}
            observation={observation}
            index={index}
            isNew={false}
          />
        ))}
      </motion.div>
    );
  }

  if (hasObservations) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <p className="text-lg text-muted-foreground mb-4">
          No observations match the selected filter.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <p className="text-lg text-muted-foreground mb-4">
        No observations yet. Click the Sync button on the dashboard to fetch your observations!
      </p>
    </motion.div>
  );
}
