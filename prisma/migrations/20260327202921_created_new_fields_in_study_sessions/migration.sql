/*
  Warnings:

  - Added the required column `startedAt` to the `study_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `study_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StudySessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED');

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "StudySessionStatus" NOT NULL,
ALTER COLUMN "studiedAt" DROP DEFAULT;
