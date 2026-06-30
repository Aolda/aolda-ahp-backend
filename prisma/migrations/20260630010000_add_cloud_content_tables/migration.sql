CREATE TABLE "CloudBriefMetric" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudBriefMetric_pkey" PRIMARY KEY ("key")
);

CREATE TABLE "CloudUseProject" (
    "id" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "description" TEXT,
    "durationFromYear" INTEGER,
    "durationFromSemester" INTEGER,
    "durationToYear" INTEGER,
    "durationToSemester" INTEGER,
    "projectImageUrl" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudUseProject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CloudFaqCategory" (
    "code" TEXT NOT NULL,
    "categoryTitle" TEXT NOT NULL,
    "categoryImageUrl" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudFaqCategory_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "CloudFaq" (
    "id" TEXT NOT NULL,
    "publicId" SERIAL NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "faqTitle" TEXT NOT NULL,
    "faqAnswer" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudFaq_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CloudNotice" (
    "id" TEXT NOT NULL,
    "publicId" SERIAL NOT NULL,
    "noticeType" TEXT NOT NULL,
    "noticeTitle" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" INTEGER,
    "authorName" TEXT,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudNotice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CloudNoticeAttachment" (
    "id" TEXT NOT NULL,
    "publicId" SERIAL NOT NULL,
    "cloudNoticeId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudNoticeAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CloudProductCategory" (
    "code" TEXT NOT NULL,
    "categoryTitle" TEXT NOT NULL,
    "categoryImageUrl" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudProductCategory_pkey" PRIMARY KEY ("code")
);

CREATE TABLE "CloudProduct" (
    "id" TEXT NOT NULL,
    "publicId" SERIAL NOT NULL,
    "categoryCode" TEXT NOT NULL,
    "projectSourceId" TEXT,
    "productIconUrl" TEXT,
    "productName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cloudLink" TEXT,
    "content" TEXT NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudProduct_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CloudProductParticipant" (
    "id" TEXT NOT NULL,
    "cloudProductId" TEXT NOT NULL,
    "crewSourceId" TEXT,
    "crewPublicId" INTEGER,
    "profileUrl" TEXT,
    "crewName" TEXT NOT NULL,
    "univDepartment" TEXT,
    "univJoinedYear" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudProductParticipant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CloudProductRelatedService" (
    "id" TEXT NOT NULL,
    "cloudProductId" TEXT NOT NULL,
    "pageTitle" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "serviceLink" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudProductRelatedService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CloudFaq_publicId_key" ON "CloudFaq"("publicId");
CREATE INDEX "CloudFaq_categoryCode_idx" ON "CloudFaq"("categoryCode");

CREATE UNIQUE INDEX "CloudNotice_publicId_key" ON "CloudNotice"("publicId");

CREATE UNIQUE INDEX "CloudNoticeAttachment_publicId_key" ON "CloudNoticeAttachment"("publicId");
CREATE INDEX "CloudNoticeAttachment_cloudNoticeId_idx" ON "CloudNoticeAttachment"("cloudNoticeId");

CREATE UNIQUE INDEX "CloudProduct_publicId_key" ON "CloudProduct"("publicId");
CREATE INDEX "CloudProduct_categoryCode_idx" ON "CloudProduct"("categoryCode");
CREATE INDEX "CloudProduct_projectSourceId_idx" ON "CloudProduct"("projectSourceId");

CREATE INDEX "CloudProductParticipant_cloudProductId_idx" ON "CloudProductParticipant"("cloudProductId");
CREATE INDEX "CloudProductRelatedService_cloudProductId_idx" ON "CloudProductRelatedService"("cloudProductId");

ALTER TABLE "CloudFaq" ADD CONSTRAINT "CloudFaq_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "CloudFaqCategory"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CloudNoticeAttachment" ADD CONSTRAINT "CloudNoticeAttachment_cloudNoticeId_fkey" FOREIGN KEY ("cloudNoticeId") REFERENCES "CloudNotice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CloudProduct" ADD CONSTRAINT "CloudProduct_categoryCode_fkey" FOREIGN KEY ("categoryCode") REFERENCES "CloudProductCategory"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CloudProduct" ADD CONSTRAINT "CloudProduct_projectSourceId_fkey" FOREIGN KEY ("projectSourceId") REFERENCES "ProjectSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CloudProductParticipant" ADD CONSTRAINT "CloudProductParticipant_cloudProductId_fkey" FOREIGN KEY ("cloudProductId") REFERENCES "CloudProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CloudProductRelatedService" ADD CONSTRAINT "CloudProductRelatedService_cloudProductId_fkey" FOREIGN KEY ("cloudProductId") REFERENCES "CloudProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
