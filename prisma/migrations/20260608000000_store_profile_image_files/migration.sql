ALTER TABLE "CrewProfileImageCache"
ADD COLUMN "sourceImageUrl" TEXT,
ADD COLUMN "localPath" TEXT,
ADD COLUMN "contentType" TEXT,
ADD COLUMN "contentHash" TEXT,
ADD COLUMN "fileSize" INTEGER;

UPDATE "CrewProfileImageCache"
SET "sourceImageUrl" = "imageUrl"
WHERE "sourceImageUrl" IS NULL;
