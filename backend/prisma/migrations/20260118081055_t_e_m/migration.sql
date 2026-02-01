/*
  Warnings:

  - You are about to drop the column `assignedTo` on the `ServiceRequest` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_assignedTo_fkey";

-- DropIndex
DROP INDEX "ServiceRequest_serviceType_idx";

-- AlterTable
ALTER TABLE "ServiceRequest" DROP COLUMN "assignedTo",
ADD COLUMN     "assignedToId" INTEGER;

-- CreateIndex
CREATE INDEX "ServiceRequest_assignedToId_idx" ON "ServiceRequest"("assignedToId");

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
