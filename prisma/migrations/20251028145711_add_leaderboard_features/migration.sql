-- AlterTable
ALTER TABLE "users" ADD COLUMN "location" TEXT;
ALTER TABLE "users" ADD COLUMN "region" TEXT;

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "friendships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "totalObservations" INTEGER NOT NULL DEFAULT 0,
    "totalSpecies" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "pointsToNextLevel" INTEGER NOT NULL DEFAULT 100,
    "rareObservations" INTEGER NOT NULL DEFAULT 0,
    "legendaryObservations" INTEGER NOT NULL DEFAULT 0,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastObservationDate" DATETIME,
    "lastSyncedAt" DATETIME,
    "weeklyPoints" INTEGER NOT NULL DEFAULT 0,
    "monthlyPoints" INTEGER NOT NULL DEFAULT 0,
    "weekStart" DATETIME,
    "monthStart" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_stats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_stats" ("currentStreak", "id", "lastObservationDate", "lastSyncedAt", "legendaryObservations", "level", "longestStreak", "pointsToNextLevel", "rareObservations", "totalObservations", "totalPoints", "totalSpecies", "updatedAt", "userId") SELECT "currentStreak", "id", "lastObservationDate", "lastSyncedAt", "legendaryObservations", "level", "longestStreak", "pointsToNextLevel", "rareObservations", "totalObservations", "totalPoints", "totalSpecies", "updatedAt", "userId" FROM "user_stats";
DROP TABLE "user_stats";
ALTER TABLE "new_user_stats" RENAME TO "user_stats";
CREATE UNIQUE INDEX "user_stats_userId_key" ON "user_stats"("userId");
CREATE INDEX "user_stats_level_idx" ON "user_stats"("level");
CREATE INDEX "user_stats_totalPoints_idx" ON "user_stats"("totalPoints");
CREATE INDEX "user_stats_weeklyPoints_idx" ON "user_stats"("weeklyPoints");
CREATE INDEX "user_stats_monthlyPoints_idx" ON "user_stats"("monthlyPoints");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "friendships_userId_idx" ON "friendships"("userId");

-- CreateIndex
CREATE INDEX "friendships_friendId_idx" ON "friendships"("friendId");

-- CreateIndex
CREATE INDEX "friendships_status_idx" ON "friendships"("status");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_userId_friendId_key" ON "friendships"("userId", "friendId");

-- CreateIndex
CREATE INDEX "users_region_idx" ON "users"("region");
