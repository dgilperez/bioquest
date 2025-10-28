-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_observations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "speciesGuess" TEXT,
    "taxonId" INTEGER,
    "taxonName" TEXT,
    "taxonRank" TEXT,
    "commonName" TEXT,
    "observedOn" DATETIME NOT NULL,
    "qualityGrade" TEXT NOT NULL,
    "photosCount" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "placeGuess" TEXT,
    "iconicTaxon" TEXT,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "globalCount" INTEGER,
    "regionalCount" INTEGER,
    "isFirstGlobal" BOOLEAN NOT NULL DEFAULT false,
    "isFirstRegional" BOOLEAN NOT NULL DEFAULT false,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "observations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_observations" ("commonName", "createdAt", "globalCount", "iconicTaxon", "id", "isFirstGlobal", "isFirstRegional", "location", "observedOn", "photosCount", "placeGuess", "pointsAwarded", "qualityGrade", "rarity", "regionalCount", "speciesGuess", "taxonId", "taxonName", "taxonRank", "updatedAt", "userId") SELECT "commonName", "createdAt", "globalCount", "iconicTaxon", "id", "isFirstGlobal", "isFirstRegional", "location", "observedOn", "photosCount", "placeGuess", "pointsAwarded", "qualityGrade", "rarity", "regionalCount", "speciesGuess", "taxonId", "taxonName", "taxonRank", "updatedAt", "userId" FROM "observations";
DROP TABLE "observations";
ALTER TABLE "new_observations" RENAME TO "observations";
CREATE INDEX "observations_userId_idx" ON "observations"("userId");
CREATE INDEX "observations_taxonId_idx" ON "observations"("taxonId");
CREATE INDEX "observations_rarity_idx" ON "observations"("rarity");
CREATE INDEX "observations_observedOn_idx" ON "observations"("observedOn");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
