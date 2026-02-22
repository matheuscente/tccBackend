/*
  Warnings:

  - You are about to drop the column `updateAt` on the `cousers` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `cousers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cousers" DROP COLUMN "updateAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;
