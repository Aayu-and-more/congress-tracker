-- CreateTable
CREATE TABLE "AlertSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "members" TEXT NOT NULL DEFAULT '[]',
    "tickers" TEXT NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertSubscription_email_key" ON "AlertSubscription"("email");
