ALTER TABLE "CrewSource" ADD COLUMN "sourceKey" TEXT;

UPDATE "CrewSource"
SET "sourceKey" = COALESCE("primaryNotionPageId", "id")
WHERE "sourceKey" IS NULL;

ALTER TABLE "CrewSource" ALTER COLUMN "sourceKey" SET NOT NULL;

CREATE UNIQUE INDEX "CrewSource_sourceKey_key" ON "CrewSource"("sourceKey");
