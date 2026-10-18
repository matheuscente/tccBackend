-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "previousRefreshToken" TEXT,
ADD COLUMN "rotatedAt" TIMESTAMP(3);
