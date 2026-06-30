ALTER TABLE "CrewProfileImageCache"
ADD COLUMN IF NOT EXISTS "sourceImageUrl" TEXT,
ADD COLUMN IF NOT EXISTS "localPath" TEXT,
ADD COLUMN IF NOT EXISTS "contentType" TEXT,
ADD COLUMN IF NOT EXISTS "contentHash" TEXT,
ADD COLUMN IF NOT EXISTS "fileSize" INTEGER;

UPDATE "CrewProfileImageCache"
SET "sourceImageUrl" = "imageUrl"
WHERE "sourceImageUrl" IS NULL;
