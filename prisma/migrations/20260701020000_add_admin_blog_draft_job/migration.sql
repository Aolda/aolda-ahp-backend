CREATE TABLE "AdminBlogDraftJob" (
    "id" TEXT NOT NULL,
    "blogPostSourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "draft" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminBlogDraftJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminBlogDraftJob_blogPostSourceId_idx" ON "AdminBlogDraftJob"("blogPostSourceId");

CREATE INDEX "AdminBlogDraftJob_status_idx" ON "AdminBlogDraftJob"("status");

ALTER TABLE "AdminBlogDraftJob" ADD CONSTRAINT "AdminBlogDraftJob_blogPostSourceId_fkey" FOREIGN KEY ("blogPostSourceId") REFERENCES "BlogPostSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
