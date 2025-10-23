import { PrismaClient } from '@prisma/client';
import { BADGE_DEFINITIONS } from '../src/lib/gamification/badges/definitions';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Seed badge definitions
  console.log(`📛 Seeding ${BADGE_DEFINITIONS.length} badge definitions...`);

  let created = 0;
  let updated = 0;

  for (const badgeDef of BADGE_DEFINITIONS) {
    const existing = await prisma.badge.findUnique({
      where: { code: badgeDef.code },
    });

    if (existing) {
      // Update existing badge
      await prisma.badge.update({
        where: { code: badgeDef.code },
        data: {
          name: badgeDef.name,
          description: badgeDef.description,
          category: badgeDef.category,
          tier: badgeDef.tier || null,
          iconUrl: badgeDef.iconUrl || null,
          criteria: badgeDef.criteria as any,
          isSecret: badgeDef.isSecret,
        },
      });
      updated++;
    } else {
      // Create new badge
      await prisma.badge.create({
        data: {
          code: badgeDef.code,
          name: badgeDef.name,
          description: badgeDef.description,
          category: badgeDef.category,
          tier: badgeDef.tier || null,
          iconUrl: badgeDef.iconUrl || null,
          criteria: badgeDef.criteria as any,
          isSecret: badgeDef.isSecret,
          sortOrder: 0,
        },
      });
      created++;
    }
  }

  console.log(`✅ Created ${created} new badges`);
  console.log(`♻️  Updated ${updated} existing badges`);

  // Verify all badges by category
  const categories = [
    'milestone',
    'taxon',
    'rarity',
    'geography',
    'time',
    'challenge',
    'secret',
  ];

  console.log('\n📊 Badge breakdown by category:');
  for (const category of categories) {
    const count = await prisma.badge.count({
      where: { category: category as any },
    });
    console.log(`   ${category}: ${count} badges`);
  }

  console.log('\n🎉 Database seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
