#!/bin/bash
# Reset the development database completely

echo "🗑️  Removing old database files..."
rm -f dev.db dev.db-journal dev.db-wal dev.db-shm

echo "🔨 Running Prisma migrations..."
npx prisma migrate reset --force --skip-seed

echo "🌱 Seeding database..."
npm run db:seed

echo "✅ Database reset complete!"
echo ""
echo "Now you can:"
echo "1. Sign in with any username (mock mode)"
echo "2. Go through onboarding from scratch"
