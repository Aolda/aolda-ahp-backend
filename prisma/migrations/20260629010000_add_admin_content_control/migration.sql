-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewSource" (
    "id" TEXT NOT NULL,
    "primaryNotionPageId" TEXT,
    "profileAccountIds" JSONB,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "profileImageUrl" TEXT,
    "notionDescription" TEXT,
    "joinedGen" INTEGER,
    "sourcePayload" JSONB,
    "sourceArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewAdminProfile" (
    "id" TEXT NOT NULL,
    "crewSourceId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewTermTeamSource" (
    "id" TEXT NOT NULL,
    "crewSourceId" TEXT NOT NULL,
    "notionPageId" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "activityTerm" TEXT NOT NULL,
    "teamName" TEXT,
    "profileAccountIds" JSONB,
    "sourcePayload" JSONB,
    "sourceArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewTermTeamSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewTermTeamOverride" (
    "id" TEXT NOT NULL,
    "crewSourceId" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "activityTerm" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "notionSyncedAt" TIMESTAMP(3),
    "notionWriteFailedAt" TIMESTAMP(3),
    "notionWriteError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewTermTeamOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSource" (
    "id" TEXT NOT NULL,
    "notionPageId" TEXT NOT NULL,
    "titleKo" TEXT NOT NULL,
    "titleEn" TEXT,
    "titleBrief" TEXT,
    "status" TEXT,
    "startedAt" TEXT,
    "endedAt" TEXT,
    "backgroundImageUrl" TEXT,
    "backgroundColor" TEXT,
    "participantRefs" JSONB,
    "sourcePayload" JSONB,
    "sourceArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectAdminProfile" (
    "id" TEXT NOT NULL,
    "projectSourceId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "titleKoOverride" TEXT,
    "titleEnOverride" TEXT,
    "titleBriefOverride" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectAdminProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlogPostSource" (
    "id" TEXT NOT NULL,
    "notionPageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "projectName" TEXT,
    "contentPreview" TEXT,
    "recordedAt" TIMESTAMP(3),
    "participantRefs" JSONB,
    "projectRefs" JSONB,
    "sourcePayload" JSONB,
    "sourceArchived" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogPostSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewProjectVisibility" (
    "id" TEXT NOT NULL,
    "crewSourceId" TEXT NOT NULL,
    "projectSourceId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewProjectVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrewBlogVisibility" (
    "id" TEXT NOT NULL,
    "crewSourceId" TEXT NOT NULL,
    "blogPostSourceId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrewBlogVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectFeaturedBlog" (
    "id" TEXT NOT NULL,
    "projectSourceId" TEXT NOT NULL,
    "blogPostSourceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectFeaturedBlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectPeriodOverride" (
    "id" TEXT NOT NULL,
    "projectSourceId" TEXT NOT NULL,
    "label" TEXT,
    "startedAt" TEXT NOT NULL,
    "endedAt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectPeriodOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectParticipantOverride" (
    "id" TEXT NOT NULL,
    "projectSourceId" TEXT NOT NULL,
    "crewSourceId" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectParticipantOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncJob" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "requestedBy" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "createdCount" INTEGER NOT NULL DEFAULT 0,
    "updatedCount" INTEGER NOT NULL DEFAULT 0,
    "archivedCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" TEXT NOT NULL,
    "syncJobId" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CrewSource_primaryNotionPageId_key" ON "CrewSource"("primaryNotionPageId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewAdminProfile_crewSourceId_key" ON "CrewAdminProfile"("crewSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewTermTeamSource_notionPageId_key" ON "CrewTermTeamSource"("notionPageId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewTermTeamSource_crewSourceId_generation_key" ON "CrewTermTeamSource"("crewSourceId", "generation");

-- CreateIndex
CREATE INDEX "CrewTermTeamSource_activityTerm_idx" ON "CrewTermTeamSource"("activityTerm");

-- CreateIndex
CREATE UNIQUE INDEX "CrewTermTeamOverride_crewSourceId_generation_key" ON "CrewTermTeamOverride"("crewSourceId", "generation");

-- CreateIndex
CREATE INDEX "CrewTermTeamOverride_activityTerm_idx" ON "CrewTermTeamOverride"("activityTerm");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSource_notionPageId_key" ON "ProjectSource"("notionPageId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectAdminProfile_projectSourceId_key" ON "ProjectAdminProfile"("projectSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "BlogPostSource_notionPageId_key" ON "BlogPostSource"("notionPageId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewProjectVisibility_crewSourceId_projectSourceId_key" ON "CrewProjectVisibility"("crewSourceId", "projectSourceId");

-- CreateIndex
CREATE INDEX "CrewProjectVisibility_projectSourceId_idx" ON "CrewProjectVisibility"("projectSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "CrewBlogVisibility_crewSourceId_blogPostSourceId_key" ON "CrewBlogVisibility"("crewSourceId", "blogPostSourceId");

-- CreateIndex
CREATE INDEX "CrewBlogVisibility_blogPostSourceId_idx" ON "CrewBlogVisibility"("blogPostSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectFeaturedBlog_projectSourceId_blogPostSourceId_key" ON "ProjectFeaturedBlog"("projectSourceId", "blogPostSourceId");

-- CreateIndex
CREATE INDEX "ProjectFeaturedBlog_blogPostSourceId_idx" ON "ProjectFeaturedBlog"("blogPostSourceId");

-- CreateIndex
CREATE INDEX "ProjectPeriodOverride_projectSourceId_idx" ON "ProjectPeriodOverride"("projectSourceId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectParticipantOverride_projectSourceId_crewSourceId_key" ON "ProjectParticipantOverride"("projectSourceId", "crewSourceId");

-- CreateIndex
CREATE INDEX "ProjectParticipantOverride_crewSourceId_idx" ON "ProjectParticipantOverride"("crewSourceId");

-- CreateIndex
CREATE INDEX "SyncJob_source_status_idx" ON "SyncJob"("source", "status");

-- CreateIndex
CREATE INDEX "SyncJob_startedAt_idx" ON "SyncJob"("startedAt");

-- CreateIndex
CREATE INDEX "SyncLog_syncJobId_idx" ON "SyncLog"("syncJobId");

-- AddForeignKey
ALTER TABLE "CrewAdminProfile" ADD CONSTRAINT "CrewAdminProfile_crewSourceId_fkey" FOREIGN KEY ("crewSourceId") REFERENCES "CrewSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewTermTeamSource" ADD CONSTRAINT "CrewTermTeamSource_crewSourceId_fkey" FOREIGN KEY ("crewSourceId") REFERENCES "CrewSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewTermTeamOverride" ADD CONSTRAINT "CrewTermTeamOverride_crewSourceId_fkey" FOREIGN KEY ("crewSourceId") REFERENCES "CrewSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAdminProfile" ADD CONSTRAINT "ProjectAdminProfile_projectSourceId_fkey" FOREIGN KEY ("projectSourceId") REFERENCES "ProjectSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewProjectVisibility" ADD CONSTRAINT "CrewProjectVisibility_crewSourceId_fkey" FOREIGN KEY ("crewSourceId") REFERENCES "CrewSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewProjectVisibility" ADD CONSTRAINT "CrewProjectVisibility_projectSourceId_fkey" FOREIGN KEY ("projectSourceId") REFERENCES "ProjectSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewBlogVisibility" ADD CONSTRAINT "CrewBlogVisibility_crewSourceId_fkey" FOREIGN KEY ("crewSourceId") REFERENCES "CrewSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrewBlogVisibility" ADD CONSTRAINT "CrewBlogVisibility_blogPostSourceId_fkey" FOREIGN KEY ("blogPostSourceId") REFERENCES "BlogPostSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFeaturedBlog" ADD CONSTRAINT "ProjectFeaturedBlog_projectSourceId_fkey" FOREIGN KEY ("projectSourceId") REFERENCES "ProjectSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectFeaturedBlog" ADD CONSTRAINT "ProjectFeaturedBlog_blogPostSourceId_fkey" FOREIGN KEY ("blogPostSourceId") REFERENCES "BlogPostSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectPeriodOverride" ADD CONSTRAINT "ProjectPeriodOverride_projectSourceId_fkey" FOREIGN KEY ("projectSourceId") REFERENCES "ProjectSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectParticipantOverride" ADD CONSTRAINT "ProjectParticipantOverride_projectSourceId_fkey" FOREIGN KEY ("projectSourceId") REFERENCES "ProjectSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectParticipantOverride" ADD CONSTRAINT "ProjectParticipantOverride_crewSourceId_fkey" FOREIGN KEY ("crewSourceId") REFERENCES "CrewSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_syncJobId_fkey" FOREIGN KEY ("syncJobId") REFERENCES "SyncJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
