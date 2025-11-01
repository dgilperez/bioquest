#!/bin/bash
# Reset the development database completely

echo "🗑️  Removing old database files..."
rm -f prisma/dev.db prisma/dev.db-journal prisma/dev.db-wal prisma/dev.db-shm

echo "🔨 Creating database schema..."
npx prisma db push

echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Database reset complete!"
echo ""
echo "Now you can:"
echo "1. Sign in with iNaturalist OAuth"
echo "2. Go through onboarding from scratch"
