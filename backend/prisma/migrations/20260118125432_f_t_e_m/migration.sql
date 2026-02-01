/*
  Warnings:

  - You are about to drop the column `updatedById` on the `Purchase` table. All the data in the column will be lost.
  - You are about to alter the column `priority` on the `ServiceRequest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `serviceType` on the `ServiceRequest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `status` on the `ServiceRequest` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(30)`.

*/
-- DropIndex
DROP INDEX "ServiceRequest_priority_idx";

-- DropIndex
DROP INDEX "ServiceRequest_serviceNo_idx";

-- DropIndex
DROP INDEX "ServiceRequest_serviceType_idx";

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "updatedById";

-- AlterTable
ALTER TABLE "ServiceRequest" ALTER COLUMN "priority" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "serviceType" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(30);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileImage" VARCHAR(255) DEFAULT 'default-avatar.png';

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransaction" (
    "id" SERIAL NOT NULL,
    "transactionNo" VARCHAR(50) NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" VARCHAR(50) NOT NULL,
    "referenceType" VARCHAR(50),
    "referenceId" VARCHAR(100),
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(15,2),
    "totalCost" DECIMAL(15,2),
    "notes" TEXT,
    "branchId" INTEGER NOT NULL DEFAULT 1,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalStock" (
    "id" SERIAL NOT NULL,
    "stocktakeNo" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "notes" TEXT,
    "warehouseId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL DEFAULT 1,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalStockItem" (
    "id" SERIAL NOT NULL,
    "physicalStockId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "systemQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "countedQty" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "variance" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "PhysicalStockItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_branchId_idx" ON "Warehouse"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransaction_transactionNo_key" ON "StockTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "StockTransaction_branchId_idx" ON "StockTransaction"("branchId");

-- CreateIndex
CREATE INDEX "StockTransaction_productId_idx" ON "StockTransaction"("productId");

-- CreateIndex
CREATE INDEX "StockTransaction_warehouseId_idx" ON "StockTransaction"("warehouseId");

-- CreateIndex
CREATE INDEX "StockTransaction_transactionDate_idx" ON "StockTransaction"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "PhysicalStock_stocktakeNo_key" ON "PhysicalStock"("stocktakeNo");

-- CreateIndex
CREATE INDEX "PhysicalStock_branchId_idx" ON "PhysicalStock"("branchId");

-- CreateIndex
CREATE INDEX "PhysicalStock_warehouseId_idx" ON "PhysicalStock"("warehouseId");

-- CreateIndex
CREATE INDEX "PhysicalStockItem_physicalStockId_idx" ON "PhysicalStockItem"("physicalStockId");

-- CreateIndex
CREATE INDEX "PhysicalStockItem_productId_idx" ON "PhysicalStockItem"("productId");

-- CreateIndex
CREATE INDEX "ServiceRequest_assignedTo_idx" ON "ServiceRequest"("assignedTo");

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransaction" ADD CONSTRAINT "StockTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStock" ADD CONSTRAINT "PhysicalStock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStock" ADD CONSTRAINT "PhysicalStock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStock" ADD CONSTRAINT "PhysicalStock_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStockItem" ADD CONSTRAINT "PhysicalStockItem_physicalStockId_fkey" FOREIGN KEY ("physicalStockId") REFERENCES "PhysicalStock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalStockItem" ADD CONSTRAINT "PhysicalStockItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
