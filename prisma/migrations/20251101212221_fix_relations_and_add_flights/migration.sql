/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "User";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "pilots" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "licenseNumber" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "pilots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogbookUpload" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pilotId" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "time" DATETIME,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "source" TEXT NOT NULL,
    CONSTRAINT "LogbookUpload_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "flight_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pilotId" TEXT NOT NULL,
    "uploadId" TEXT,
    "departureAirfield" TEXT NOT NULL,
    "tailNumber" TEXT NOT NULL,
    "depDate" TEXT NOT NULL,
    "hours" DECIMAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "flight_entries_pilotId_fkey" FOREIGN KEY ("pilotId") REFERENCES "pilots" ("userId") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flight_entries_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "LogbookUpload" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pilots_licenseNumber_key" ON "pilots"("licenseNumber");
