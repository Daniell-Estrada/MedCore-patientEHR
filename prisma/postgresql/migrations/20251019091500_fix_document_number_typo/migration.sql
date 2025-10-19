-- Rename column docuementNumber -> documentNumber and adjust unique index
-- Safe approach: add new column, copy data, drop old, then rename constraints

-- 1) Add new column as nullable to avoid failure on existing rows
ALTER TABLE "Patient" ADD COLUMN "documentNumber" TEXT;

-- 2) Copy data from old column if exists
UPDATE "Patient" SET "documentNumber" = "docuementNumber" WHERE "documentNumber" IS NULL;

-- 3) Drop old unique index if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = ANY (current_schemas(false)) AND indexname = 'Patient_docuementNumber_key'
  ) THEN
    EXECUTE 'DROP INDEX "Patient_docuementNumber_key"';
  END IF;
END $$;

-- 4) Set NOT NULL on new column (assumes data is present or handled at app level)
ALTER TABLE "Patient" ALTER COLUMN "documentNumber" SET NOT NULL;

-- 5) Create new unique index
CREATE UNIQUE INDEX "Patient_documentNumber_key" ON "Patient" ("documentNumber");

-- 6) Drop old column
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "docuementNumber";
