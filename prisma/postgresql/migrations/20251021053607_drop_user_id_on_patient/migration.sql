/*
  Warnings:

  - You are about to drop the column `userId` on the `Patient` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Patient_userId_idx";

-- DropIndex
DROP INDEX "public"."Patient_userId_key";

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "userId";
