ALTER TABLE "CrewSource" ADD COLUMN "profileImageCacheUrl" TEXT;
CREATE TABLE "CrewImageRefreshJob" (
  "id" TEXT NOT NULL PRIMARY KEY, "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "activeKey" TEXT, "owner" TEXT NOT NULL, "requestedBy" TEXT NOT NULL,
  "leaseUntil" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3)
);
CREATE UNIQUE INDEX "CrewImageRefreshJob_activeKey_key" ON "CrewImageRefreshJob"("activeKey");
CREATE INDEX "CrewImageRefreshJob_createdAt_idx" ON "CrewImageRefreshJob"("createdAt");
CREATE TABLE "CrewImageRefreshItem" (
  "id" TEXT NOT NULL PRIMARY KEY, "jobId" TEXT NOT NULL, "crewId" TEXT NOT NULL,
  "crewName" TEXT NOT NULL, "notionPageId" TEXT, "status" TEXT NOT NULL DEFAULT 'PENDING',
  "message" TEXT, "finishedAt" TIMESTAMP(3),
  CONSTRAINT "CrewImageRefreshItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "CrewImageRefreshJob"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CrewImageRefreshItem_jobId_crewId_key" ON "CrewImageRefreshItem"("jobId", "crewId");
