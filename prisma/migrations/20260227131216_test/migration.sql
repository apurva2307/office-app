/*
  Warnings:

  - The values [LEAVE,PURCHASE] on the enum `ApplicationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('EMPLOYEE_TO_SO', 'EMPLOYEE_TO_ADMIN', 'SO_TO_ADMIN', 'ADMIN_TO_SUPERADMIN');

-- AlterEnum
BEGIN;
CREATE TYPE "ApplicationType_new" AS ENUM ('GENERAL', 'GRIEVANCE', 'OTHERS');
ALTER TABLE "Application" ALTER COLUMN "type" TYPE "ApplicationType_new" USING ("type"::text::"ApplicationType_new");
ALTER TYPE "ApplicationType" RENAME TO "ApplicationType_old";
ALTER TYPE "ApplicationType_new" RENAME TO "ApplicationType";
DROP TYPE "ApplicationType_old";
COMMIT;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserHierarchy" (
    "id" TEXT NOT NULL,
    "supervisorId" TEXT NOT NULL,
    "subordinateId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserHierarchy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserHierarchy_supervisorId_idx" ON "UserHierarchy"("supervisorId");

-- CreateIndex
CREATE INDEX "UserHierarchy_subordinateId_idx" ON "UserHierarchy"("subordinateId");

-- CreateIndex
CREATE UNIQUE INDEX "UserHierarchy_supervisorId_subordinateId_relationshipType_key" ON "UserHierarchy"("supervisorId", "subordinateId", "relationshipType");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHierarchy" ADD CONSTRAINT "UserHierarchy_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserHierarchy" ADD CONSTRAINT "UserHierarchy_subordinateId_fkey" FOREIGN KEY ("subordinateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
