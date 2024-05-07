-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "statsId" INTEGER NOT NULL,
    CONSTRAINT "User_statsId_fkey" FOREIGN KEY ("statsId") REFERENCES "UserStats" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserStats" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "crystals" INTEGER NOT NULL DEFAULT 0,
    "copper" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "rank" INTEGER NOT NULL DEFAULT 1,
    "strength" INTEGER NOT NULL DEFAULT 1,
    "soldiers" INTEGER NOT NULL DEFAULT 0,
    "grappleHooks" INTEGER NOT NULL DEFAULT 0,
    "potions1" INTEGER NOT NULL DEFAULT 0,
    "potions2" INTEGER NOT NULL DEFAULT 0,
    "swords" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_statsId_key" ON "User"("statsId");
