import { toast } from 'sonner';
import { Badge, BadgeDefinition, Quest } from '@/types';

/**
 * Show badge unlock notification
 */
export function notifyBadgeUnlock(badge: Badge | BadgeDefinition) {
  toast.success('Badge Unlocked!', {
    description: `🏆 ${badge.name} - ${badge.description}`,
    duration: 6000,
  });
}

/**
 * Show multiple badges unlocked notification
 */
export function notifyMultipleBadges(badges: (Badge | BadgeDefinition)[]) {
  if (badges.length === 0) return;

  if (badges.length === 1) {
    notifyBadgeUnlock(badges[0]);
  } else {
    toast.success(`${badges.length} Badges Unlocked!`, {
      description: badges.map(b => `🏆 ${b.name}`).join('\n'),
      duration: 7000,
    });
  }
}

/**
 * Show level up notification
 */
export function notifyLevelUp(newLevel: number, levelTitle: string) {
  toast.success('Level Up!', {
    description: `🎉 You reached Level ${newLevel}: ${levelTitle}`,
    duration: 6000,
  });
}

/**
 * Show rare observation notification
 */
export function notifyRareObservation(rarity: 'rare' | 'legendary', speciesName: string) {
  const emoji = rarity === 'legendary' ? '✨' : '💎';
  const rarityText = rarity === 'legendary' ? 'Legendary' : 'Rare';

  toast.success(`${rarityText} Find!`, {
    description: `${emoji} You discovered a ${rarityText.toLowerCase()} species: ${speciesName}`,
    duration: 6000,
  });
}

/**
 * Show new species notification
 */
export function notifyNewSpecies(speciesName: string) {
  toast.success('New Species!', {
    description: `🌿 Added to your collection: ${speciesName}`,
    duration: 5000,
  });
}

/**
 * Show sync complete notification
 */
export function notifySyncComplete(newObservations: number) {
  if (newObservations === 0) {
    toast.info('Sync Complete', {
      description: 'Your data is up to date!',
      duration: 3000,
    });
  } else {
    toast.success('Sync Complete', {
      description: `📸 Found ${newObservations} new observation${newObservations !== 1 ? 's' : ''}!`,
      duration: 4000,
    });
  }
}

/**
 * Show error notification
 */
export function notifyError(message: string) {
  toast.error('Error', {
    description: message,
    duration: 5000,
  });
}

/**
 * Show success notification
 */
export function notifySuccess(message: string) {
  toast.success('Success', {
    description: message,
    duration: 3000,
  });
}

/**
 * Show quest completion notification
 */
export function notifyQuestComplete(quest: Quest, pointsEarned: number) {
  const questTypeEmoji: Record<string, string> = {
    daily: '📅',
    weekly: '📆',
    monthly: '🗓️',
    personal: '🎯',
    event: '🎉',
  };
  const emoji = questTypeEmoji[quest.type] || '📋';

  toast.success('Quest Completed!', {
    description: `${emoji} ${quest.title} - Earned ${pointsEarned} points!`,
    duration: 6000,
  });
}

/**
 * Show multiple quests completed notification
 */
export function notifyMultipleQuests(quests: Quest[], totalPoints: number) {
  if (quests.length === 0) return;

  if (quests.length === 1) {
    notifyQuestComplete(quests[0], quests[0].reward.points || 0);
  } else {
    toast.success(`${quests.length} Quests Completed!`, {
      description: `🎉 Earned ${totalPoints} bonus points!`,
      duration: 7000,
    });
  }
}
