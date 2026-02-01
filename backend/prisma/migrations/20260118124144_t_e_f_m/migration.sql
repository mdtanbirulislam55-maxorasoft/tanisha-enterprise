/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `ServiceRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_assignedToId_fkey";

-- DropIndex
DROP INDEX "ServiceRequest_assignedToId_idx";

-- DropIndex
DROP INDEX "ServiceRequest_createdAt_idx";

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "assignedToId",
ADD COLUMN     "assignedTo" INTEGER;

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceNo_idx" ON "ServiceRequest"("serviceNo");

-- CreateIndex
CREATE INDEX "ServiceRequest_serviceType_idx" ON "ServiceRequest"("serviceType");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
