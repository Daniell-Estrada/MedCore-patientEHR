/*
  Warnings:

  - You are about to drop the column `date` on the `Diagnostic` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `Diagnostic` table. All the data in the column will be lost.
  - You are about to drop the column `consultDate` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `diagnosis` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `doctorId` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `nextAppointment` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `observations` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `physicalExam` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `prescriptions` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `reason` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `symptoms` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `treatment` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `vitalSigns` on the `MedicalHistory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[patientId]` on the table `MedicalHistory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `medicalHistoryId` to the `Diagnostic` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdBy` to the `MedicalHistory` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add new columns with defaults (to handle existing data)
ALTER TABLE "public"."Diagnostic" 
ADD COLUMN "consultDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "medicalHistoryId" TEXT,
ADD COLUMN "physicalExam" TEXT,
ADD COLUMN "prescriptions" TEXT,
ADD COLUMN "vitalSigns" TEXT;

ALTER TABLE "public"."MedicalHistory"
ADD COLUMN "createdBy" TEXT;

-- Step 2: Copy doctorId to createdBy for existing records
UPDATE "public"."MedicalHistory"
SET "createdBy" = "doctorId"
WHERE "doctorId" IS NOT NULL;

-- Step 3: Set createdBy to a default value if still NULL (fallback)
UPDATE "public"."MedicalHistory"
SET "createdBy" = '00000000-0000-0000-0000-000000000000'
WHERE "createdBy" IS NULL;

-- Step 4: For each Diagnostic, set medicalHistoryId to the MedicalHistory of its patient
UPDATE "public"."Diagnostic" AS d
SET "medicalHistoryId" = (
  SELECT mh.id 
  FROM "public"."MedicalHistory" AS mh 
  WHERE mh."patientId" = d."patientId"
  LIMIT 1
)
WHERE d."medicalHistoryId" IS NULL;

-- Step 5: Copy date to consultDate if date exists
UPDATE "public"."Diagnostic"
SET "consultDate" = "date"
WHERE "date" IS NOT NULL;

-- Step 6: Now make createdBy and medicalHistoryId NOT NULL
ALTER TABLE "public"."MedicalHistory" ALTER COLUMN "createdBy" SET NOT NULL;
ALTER TABLE "public"."Diagnostic" ALTER COLUMN "medicalHistoryId" SET NOT NULL;

-- Step 7: Drop foreign keys
ALTER TABLE "public"."Diagnostic" DROP CONSTRAINT IF EXISTS "Diagnostic_patientId_fkey";
ALTER TABLE "public"."MedicalHistory" DROP CONSTRAINT IF EXISTS "MedicalHistory_patientId_fkey";

-- Step 8: Drop old indexes
DROP INDEX IF EXISTS "public"."Diagnostic_patientId_idx";
DROP INDEX IF EXISTS "public"."MedicalHistory_consultDate_idx";
DROP INDEX IF EXISTS "public"."MedicalHistory_doctorId_idx";

-- Step 9: Drop old columns from Diagnostic
ALTER TABLE "public"."Diagnostic" 
DROP COLUMN IF EXISTS "date",
DROP COLUMN IF EXISTS "patientId";

-- Step 10: Drop old columns from MedicalHistory
ALTER TABLE "public"."MedicalHistory" 
DROP COLUMN IF EXISTS "consultDate",
DROP COLUMN IF EXISTS "diagnosis",
DROP COLUMN IF EXISTS "doctorId",
DROP COLUMN IF EXISTS "nextAppointment",
DROP COLUMN IF EXISTS "observations",
DROP COLUMN IF EXISTS "physicalExam",
DROP COLUMN IF EXISTS "prescriptions",
DROP COLUMN IF EXISTS "reason",
DROP COLUMN IF EXISTS "symptoms",
DROP COLUMN IF EXISTS "treatment",
DROP COLUMN IF EXISTS "vitalSigns";

-- Step 11: Create new indexes
CREATE INDEX "Diagnostic_medicalHistoryId_idx" ON "public"."Diagnostic"("medicalHistoryId");
CREATE INDEX "Diagnostic_consultDate_idx" ON "public"."Diagnostic"("consultDate");
CREATE UNIQUE INDEX "MedicalHistory_patientId_key" ON "public"."MedicalHistory"("patientId");
CREATE INDEX "MedicalHistory_createdBy_idx" ON "public"."MedicalHistory"("createdBy");

-- Step 12: Add new foreign keys
ALTER TABLE "public"."Diagnostic" 
ADD CONSTRAINT "Diagnostic_medicalHistoryId_fkey" 
FOREIGN KEY ("medicalHistoryId") REFERENCES "public"."MedicalHistory"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."MedicalHistory" 
ADD CONSTRAINT "MedicalHistory_patientId_fkey" 
FOREIGN KEY ("patientId") REFERENCES "public"."Patient"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
