-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "ExampleRecord" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExampleRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewProfileImageCache" (
    "notionPageId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewProfileImageCache_pkey" PRIMARY KEY ("notionPageId")
);

-- CreateTable
CREATE TABLE "TeamActivityMetadata" (
    "id" SERIAL NOT NULL,
    "notionPageId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "koName" TEXT NOT NULL,
    "enName" TEXT,
    "briefName" TEXT,
    "description" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamActivityMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamActivityMetadata_notionPageId_key" ON "TeamActivityMetadata"("notionPageId");

