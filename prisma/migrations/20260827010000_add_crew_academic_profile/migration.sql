-- Additive only. Existing content, visibility, and administrator edits are retained.
ALTER TABLE "CrewSource"
  ADD COLUMN "univDepartment" TEXT,
  ADD COLUMN "univJoinedYear" TEXT;

ALTER TABLE "CrewAdminProfile"
  ADD COLUMN "univDepartmentOverride" TEXT,
  ADD COLUMN "univJoinedYearOverride" TEXT;
