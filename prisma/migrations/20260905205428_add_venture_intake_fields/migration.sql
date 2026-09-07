-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Venture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "hasToken" BOOLEAN NOT NULL DEFAULT false,
    "tokenSymbol" TEXT,
    "tokenChainId" TEXT,
    "tokenContractAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Venture" ("category", "createdAt", "description", "id", "isDemo", "name", "tokenChainId", "tokenContractAddress", "tokenSymbol", "updatedAt") SELECT "category", "createdAt", "description", "id", "isDemo", "name", "tokenChainId", "tokenContractAddress", "tokenSymbol", "updatedAt" FROM "Venture";
DROP TABLE "Venture";
ALTER TABLE "new_Venture" RENAME TO "Venture";
CREATE INDEX "Venture_name_idx" ON "Venture"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
