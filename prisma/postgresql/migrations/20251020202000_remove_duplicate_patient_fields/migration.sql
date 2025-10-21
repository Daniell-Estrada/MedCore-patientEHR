-- Remove duplicate fields from Patient table
-- These fields should only exist in ms-security Users table
-- This migration removes fields that are already stored in the security microservice
-- Drop unique constraint on documentNumber before dropping the column
DROP INDEX IF EXISTS "Patient_documentNumber_key";

-- Remove duplicate columns (data is preserved in ms-security)
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "documentNumber";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "birthDate";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "age";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "gender";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "phone";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "address";
ALTER TABLE "Patient" DROP COLUMN IF EXISTS "status";

-- Add index on userId for better query performance
CREATE INDEX IF NOT EXISTS "Patient_userId_idx" ON "Patient"("userId");

