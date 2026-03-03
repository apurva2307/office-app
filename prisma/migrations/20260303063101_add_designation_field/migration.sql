/*
  Warnings:

  - Added the required column `designation` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `department` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "designation" TEXT NOT NULL,
ALTER COLUMN "department" SET NOT NULL,
ALTER COLUMN "department" SET DEFAULT 'Accounts';
