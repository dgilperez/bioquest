import { prisma } from '@/lib/db/prisma';
import {
  QuestDefinition,
  getRandomDailyQuests,
  getRandomWeeklyQuests,
  getRandomMonthlyQuests,
} from './definitions';
import { Quest, QuestType } from '@/types';

/**
 * Get start of day in UTC
 */
function getStartOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of week (Monday) in UTC
 */
function getStartOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get start of month in UTC
 */
function getStartOfMonth(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end date based on quest type
 */
function getEndDate(startDate: Date, durationDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + durationDays);
  endDate.setUTCHours(23, 59, 59, 999);
  return endDate;
}

/**
 * Create quest in database from definition
 */
async function createQuestFromDefinition(def: QuestDefinition): Promise<Quest> {
  let startDate: Date;

  switch (def.type) {
    case 'daily':
      startDate = getStartOfDay();
      break;
    case 'weekly':
      startDate = getStartOfWeek();
      break;
    case 'monthly':
      startDate = getStartOfMonth();
      break;
    default:
      startDate = new Date();
  }

  const endDate = getEndDate(startDate, def.durationDays);

  const quest = await prisma.quest.create({
    data: {
      code: def.code,
      title: def.title,
      description: def.description,
      type: def.type,
      startDate,
      endDate,
      criteria: def.criteria as any,
      reward: def.reward as any,
    },
  });

  return quest as Quest;
}

/**
 * Generate daily quests for today
 * Creates 3 random daily quests
 */
export async function generateDailyQuests(): Promise<Quest[]> {
  const today = getStartOfDay();

  // Check if daily quests already exist for today
  const existingQuests = await prisma.quest.findMany({
    where: {
      type: 'daily',
      startDate: {
        gte: today,
        lt: getEndDate(today, 1),
      },
    },
  });

  if (existingQuests.length > 0) {
    return existingQuests as Quest[];
  }

  // Generate 3 new daily quests
  const definitions = getRandomDailyQuests(3);
  const quests: Quest[] = [];

  for (const def of definitions) {
    const quest = await createQuestFromDefinition(def);
    quests.push(quest);
  }

  return quests;
}

/**
 * Generate weekly quests for this week
 * Creates 2 random weekly quests
 */
export async function generateWeeklyQuests(): Promise<Quest[]> {
  const weekStart = getStartOfWeek();

  // Check if weekly quests already exist for this week
  const existingQuests = await prisma.quest.findMany({
    where: {
      type: 'weekly',
      startDate: {
        gte: weekStart,
        lt: getEndDate(weekStart, 7),
      },
    },
  });

  if (existingQuests.length > 0) {
    return existingQuests as Quest[];
  }

  // Generate 2 new weekly quests
  const definitions = getRandomWeeklyQuests(2);
  const quests: Quest[] = [];

  for (const def of definitions) {
    const quest = await createQuestFromDefinition(def);
    quests.push(quest);
  }

  return quests;
}

/**
 * Generate monthly quests for this month
 * Creates 2 random monthly quests
 */
export async function generateMonthlyQuests(): Promise<Quest[]> {
  const monthStart = getStartOfMonth();

  // Check if monthly quests already exist for this month
  const existingQuests = await prisma.quest.findMany({
    where: {
      type: 'monthly',
      startDate: {
        gte: monthStart,
        lt: getEndDate(monthStart, 30),
      },
    },
  });

  if (existingQuests.length > 0) {
    return existingQuests as Quest[];
  }

  // Generate 2 new monthly quests
  const definitions = getRandomMonthlyQuests(2);
  const quests: Quest[] = [];

  for (const def of definitions) {
    const quest = await createQuestFromDefinition(def);
    quests.push(quest);
  }

  return quests;
}

/**
 * Generate all quests (daily, weekly, monthly)
 * Called during cron job or on-demand
 */
export async function generateAllQuests(): Promise<{
  daily: Quest[];
  weekly: Quest[];
  monthly: Quest[];
}> {
  const [daily, weekly, monthly] = await Promise.all([
    generateDailyQuests(),
    generateWeeklyQuests(),
    generateMonthlyQuests(),
  ]);

  return { daily, weekly, monthly };
}

/**
 * Expire old quests
 * Marks quests as expired if their end date has passed
 */
export async function expireOldQuests(): Promise<number> {
  const now = new Date();

  const result = await prisma.userQuest.updateMany({
    where: {
      status: 'active',
      quest: {
        endDate: {
          lt: now,
        },
      },
    },
    data: {
      status: 'expired',
    },
  });

  return result.count;
}

/**
 * Assign quest to user
 * Creates a UserQuest entry
 */
export async function assignQuestToUser(userId: string, questId: string): Promise<void> {
  // Check if user already has this quest
  const existing = await prisma.userQuest.findFirst({
    where: {
      userId,
      questId,
    },
  });

  if (existing) {
    return; // Already assigned
  }

  await prisma.userQuest.create({
    data: {
      userId,
      questId,
      status: 'active',
      progress: 0,
    },
  });
}

/**
 * Assign all available quests to a user
 * Called when user signs in or manually syncs
 */
export async function assignAvailableQuestsToUser(userId: string): Promise<void> {
  // Generate quests if they don't exist
  await generateAllQuests();

  // Get all active quests (not expired)
  const now = new Date();
  const activeQuests = await prisma.quest.findMany({
    where: {
      endDate: {
        gte: now,
      },
    },
  });

  // Assign each quest to the user
  for (const quest of activeQuests) {
    await assignQuestToUser(userId, quest.id);
  }
}

/**
 * Get quest type from quest ID
 */
export async function getQuestType(questId: string): Promise<QuestType | null> {
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    select: { type: true },
  });

  return quest?.type as QuestType || null;
}
