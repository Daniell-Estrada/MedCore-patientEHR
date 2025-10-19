/*
  Warnings:

  - You are about to drop the column `fullName` on the `Patient` table. All the data in the column will be lost.
  - You are about to drop the column `userSnapshot` on the `Patient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[docuementNumber]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `age` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birthDate` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docuementNumber` to the `Patient` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gender` to the `Patient` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DiagnosticState" AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "fullName",
DROP COLUMN "userSnapshot",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "birthDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "docuementNumber" TEXT NOT NULL,
ADD COLUMN     "gender" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT;

-- CreateTable
CREATE TABLE "Diagnostic" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment" TEXT NOT NULL,
    "observations" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextAppointment" TIMESTAMP(3),
    "state" "DiagnosticState" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticDocument" (
    "id" TEXT NOT NULL,
    "diagnosticId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "description" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Diagnostic_patientId_idx" ON "Diagnostic"("patientId");

-- CreateIndex
CREATE INDEX "Diagnostic_doctorId_idx" ON "Diagnostic"("doctorId");

-- CreateIndex
CREATE INDEX "DiagnosticDocument_diagnosticId_idx" ON "DiagnosticDocument"("diagnosticId");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_docuementNumber_key" ON "Patient"("docuementNumber");

-- AddForeignKey
ALTER TABLE "Diagnostic" ADD CONSTRAINT "Diagnostic_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticDocument" ADD CONSTRAINT "DiagnosticDocument_diagnosticId_fkey" FOREIGN KEY ("diagnosticId") REFERENCES "Diagnostic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
