/*
  Warnings:

  - You are about to drop the column `businessType` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `creditDays` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `division` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `nid` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `phone2` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `thana` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `tin` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `tradeLicense` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `accountHeadId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `branchName` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `chequeDate` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `chequeNo` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `clearedDate` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `mobileBanking` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentType` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `serviceRequestId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `currentStock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `otherCharges` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCharge` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `unitPrice` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `PurchaseItem` table. All the data in the column will be lost.
  - You are about to drop the column `advanceAmount` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `customerAddress` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryDate` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `deliveryStatus` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `discountPercent` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `otherCharges` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `postedAt` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `roundOff` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `shippingCharge` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `terms` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `batchNo` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `costPrice` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `profit` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `returnedQty` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `serialNo` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxAmount` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `taxRate` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseId` on the `SaleItem` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `contactPerson` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `tradeLicense` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `vatRegNo` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the column `profileImage` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `token` on the `refresh_tokens` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(255)`.
  - You are about to drop the `AccountHead` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AuditLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CompanySetting` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JournalEntry` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JournalEntryItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServiceRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockAdjustment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockAdjustmentItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockTransfer` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `StockTransferItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SystemConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Warehouse` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[barcode]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Made the column `openingBalance` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `currentBalance` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Made the column `creditLimit` on table `Customer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `totalCost` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitCost` to the `PurchaseItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone1` to the `Supplier` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AccountHead" DROP CONSTRAINT "AccountHead_branchId_fkey";

-- DropForeignKey
ALTER TABLE "AccountHead" DROP CONSTRAINT "AccountHead_parentId_fkey";

-- DropForeignKey
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "CompanySetting" DROP CONSTRAINT "CompanySetting_branchId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_branchId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_createdById_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntryItem" DROP CONSTRAINT "JournalEntryItem_accountHeadId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntryItem" DROP CONSTRAINT "JournalEntryItem_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_serviceRequestId_fkey";

-- DropForeignKey
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "SaleItem" DROP CONSTRAINT "SaleItem_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceItem" DROP CONSTRAINT "ServiceItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceItem" DROP CONSTRAINT "ServiceItem_serviceRequestId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_branchId_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_createdById_fkey";

-- DropForeignKey
ALTER TABLE "ServiceRequest" DROP CONSTRAINT "ServiceRequest_customerId_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustment" DROP CONSTRAINT "StockAdjustment_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustment" DROP CONSTRAINT "StockAdjustment_branchId_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustment" DROP CONSTRAINT "StockAdjustment_createdById_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustment" DROP CONSTRAINT "StockAdjustment_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustmentItem" DROP CONSTRAINT "StockAdjustmentItem_adjustmentId_fkey";

-- DropForeignKey
ALTER TABLE "StockAdjustmentItem" DROP CONSTRAINT "StockAdjustmentItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockItem" DROP CONSTRAINT "StockItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockItem" DROP CONSTRAINT "StockItem_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "StockItem" DROP CONSTRAINT "StockItem_warehouseId_fkey";

-- DropForeignKey
ALTER TABLE "StockTransfer" DROP CONSTRAINT "StockTransfer_branchId_fkey";

-- DropForeignKey
ALTER TABLE "StockTransfer" DROP CONSTRAINT "StockTransfer_createdById_fkey";

-- DropForeignKey
ALTER TABLE "StockTransfer" DROP CONSTRAINT "StockTransfer_fromWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "StockTransfer" DROP CONSTRAINT "StockTransfer_receivedById_fkey";

-- DropForeignKey
ALTER TABLE "StockTransfer" DROP CONSTRAINT "StockTransfer_toWarehouseId_fkey";

-- DropForeignKey
ALTER TABLE "StockTransferItem" DROP CONSTRAINT "StockTransferItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockTransferItem" DROP CONSTRAINT "StockTransferItem_transferId_fkey";

-- DropForeignKey
ALTER TABLE "Warehouse" DROP CONSTRAINT "Warehouse_branchId_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_userId_fkey";

-- DropIndex
DROP INDEX "Branch_code_idx";

-- DropIndex
DROP INDEX "Branch_name_idx";

-- DropIndex
DROP INDEX "Customer_code_idx";

-- DropIndex
DROP INDEX "Payment_paymentMethod_idx";

-- DropIndex
DROP INDEX "Payment_referenceNo_idx";

-- DropIndex
DROP INDEX "Purchase_invoiceNumber_idx";

-- DropIndex
DROP INDEX "Purchase_status_idx";

-- DropIndex
DROP INDEX "Sale_invoiceNumber_idx";

-- DropIndex
DROP INDEX "Sale_paymentStatus_idx";

-- DropIndex
DROP INDEX "Sale_status_idx";

-- DropIndex
DROP INDEX "Supplier_code_idx";

-- DropIndex
DROP INDEX "Supplier_phone_idx";

-- DropIndex
DROP INDEX "User_email_idx";

-- DropIndex
DROP INDEX "User_username_idx";

-- DropIndex
DROP INDEX "refresh_tokens_expiresAt_idx";

-- DropIndex
DROP INDEX "refresh_tokens_token_idx";

-- DropIndex
DROP INDEX "refresh_tokens_userId_token_key";

-- AlterTable
ALTER TABLE "Branch" ALTER COLUMN "code" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "businessType",
DROP COLUMN "company",
DROP COLUMN "creditDays",
DROP COLUMN "district",
DROP COLUMN "division",
DROP COLUMN "nid",
DROP COLUMN "phone2",
DROP COLUMN "thana",
DROP COLUMN "tin",
DROP COLUMN "tradeLicense",
DROP COLUMN "type",
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" TEXT DEFAULT 'Bangladesh',
ADD COLUMN     "customerType" VARCHAR(100),
ALTER COLUMN "openingBalance" SET NOT NULL,
ALTER COLUMN "currentBalance" SET NOT NULL,
ALTER COLUMN "creditLimit" SET NOT NULL;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "accountHeadId",
DROP COLUMN "bankName",
DROP COLUMN "branchName",
DROP COLUMN "chequeDate",
DROP COLUMN "chequeNo",
DROP COLUMN "clearedDate",
DROP COLUMN "description",
DROP COLUMN "mobileBanking",
DROP COLUMN "paymentType",
DROP COLUMN "serviceRequestId",
DROP COLUMN "transactionId",
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "currentStock",
ADD COLUMN     "barcode" VARCHAR(100),
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "images" JSONB,
ADD COLUMN     "isService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxDiscount" DECIMAL(5,2),
ADD COLUMN     "minSellingPrice" DECIMAL(15,2),
ADD COLUMN     "stockQuantity" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "supplierId" INTEGER,
ADD COLUMN     "updatedById" INTEGER,
ADD COLUMN     "warrantyMonths" INTEGER;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "otherCharges",
DROP COLUMN "shippingCharge",
DROP COLUMN "warehouseId",
ADD COLUMN     "updatedById" INTEGER;

-- AlterTable
ALTER TABLE "PurchaseItem" DROP COLUMN "costPrice",
DROP COLUMN "discount",
DROP COLUMN "taxAmount",
DROP COLUMN "taxRate",
DROP COLUMN "totalPrice",
DROP COLUMN "unitPrice",
DROP COLUMN "warehouseId",
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "totalCost" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "unitCost" DECIMAL(15,2) NOT NULL;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "advanceAmount",
DROP COLUMN "customerAddress",
DROP COLUMN "deliveryDate",
DROP COLUMN "deliveryStatus",
DROP COLUMN "discountPercent",
DROP COLUMN "otherCharges",
DROP COLUMN "postedAt",
DROP COLUMN "roundOff",
DROP COLUMN "shippingCharge",
DROP COLUMN "terms",
DROP COLUMN "warehouseId";

-- AlterTable
ALTER TABLE "SaleItem" DROP COLUMN "batchNo",
DROP COLUMN "costPrice",
DROP COLUMN "description",
DROP COLUMN "discount",
DROP COLUMN "profit",
DROP COLUMN "returnedQty",
DROP COLUMN "serialNo",
DROP COLUMN "taxAmount",
DROP COLUMN "taxRate",
DROP COLUMN "warehouseId";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "company",
DROP COLUMN "contactPerson",
DROP COLUMN "phone",
DROP COLUMN "tradeLicense",
DROP COLUMN "vatRegNo",
ADD COLUMN     "phone1" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "profileImage",
ALTER COLUMN "fullName" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "token" SET DATA TYPE VARCHAR(255);

-- DropTable
DROP TABLE "AccountHead";

-- DropTable
DROP TABLE "AuditLog";

-- DropTable
DROP TABLE "CompanySetting";

-- DropTable
DROP TABLE "JournalEntry";

-- DropTable
DROP TABLE "JournalEntryItem";

-- DropTable
DROP TABLE "ServiceItem";

-- DropTable
DROP TABLE "ServiceRequest";

-- DropTable
DROP TABLE "StockAdjustment";

-- DropTable
DROP TABLE "StockAdjustmentItem";

-- DropTable
DROP TABLE "StockItem";

-- DropTable
DROP TABLE "StockTransfer";

-- DropTable
DROP TABLE "StockTransferItem";

-- DropTable
DROP TABLE "SystemConfig";

-- DropTable
DROP TABLE "Warehouse";

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Payment_branchId_idx" ON "Payment"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

-- CreateIndex
CREATE INDEX "Product_branchId_idx" ON "Product"("branchId");

-- CreateIndex
CREATE INDEX "Purchase_branchId_idx" ON "Purchase"("branchId");

-- CreateIndex
CREATE INDEX "Supplier_branchId_idx" ON "Supplier"("branchId");

-- CreateIndex
CREATE INDEX "Supplier_phone1_idx" ON "Supplier"("phone1");

-- CreateIndex
CREATE INDEX "User_branchId_idx" ON "User"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
