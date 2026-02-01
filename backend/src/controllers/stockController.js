const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateStockNumber } = require('../utils/dateUtils');

// ==================== STOCK TRANSACTIONS ====================
exports.getStockTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      productId,
      transactionType,
      warehouseId,
      referenceType,
      referenceId
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const branchId = req.user?.branchId;

    const where = {};
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (productId) {
      where.productId = parseInt(productId);
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (warehouseId) {
      where.OR = [
        { warehouseId: parseInt(warehouseId) },
        { fromWarehouseId: parseInt(warehouseId) },
        { toWarehouseId: parseInt(warehouseId) }
      ];
    }

    if (referenceType && referenceId) {
      where.referenceType = referenceType;
      where.referenceId = parseInt(referenceId);
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true
            }
          },
          warehouse: {
            select: {
              id: true,
              name: true
            }
          },
          fromWarehouse: {
            select: {
              id: true,
              name: true
            }
          },
          toWarehouse: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          transactionDate: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.stockTransaction.count({ where })
    ]);

    // Calculate summary
    const summary = await prisma.stockTransaction.aggregate({
      where,
      _sum: {
        quantity: true,
        totalValue: true
      }
    });

    // Group by transaction type
    const byType = await prisma.stockTransaction.groupBy({
      by: ['transactionType'],
      where,
      _sum: {
        quantity: true,
        totalValue: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        transactions,
        summary: {
          totalQuantity: summary._sum.quantity || 0,
          totalValue: summary._sum.totalValue || 0,
          byType
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get stock transactions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock transactions'
    });
  }
};

// ==================== CURRENT STOCK ====================
exports.getCurrentStock = async (req, res) => {
  try {
    const {
      search = '',
      category,
      warehouseId = 1,
      lowStockOnly = false,
      outOfStockOnly = false,
      page = 1,
      limit = 50
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const branchId = req.user?.branchId;

    const where = { isActive: true };
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (category) {
      where.category = category;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          category: true,
          unit: true,
          costPrice: true,
          sellPrice: true,
          stockQuantity: true,
          reorderLevel: true,
          alertQuantity: true,
          brand: true,
          model: true,
          origin: true
        },
        orderBy: {
          name: 'asc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.product.count({ where })
    ]);

    // Filter based on stock conditions
    let filteredProducts = products;
    
    if (lowStockOnly === 'true') {
      filteredProducts = products.filter(p => 
        p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0
      );
    }
    
    if (outOfStockOnly === 'true') {
      filteredProducts = products.filter(p => p.stockQuantity <= 0);
    }

    // Calculate stock value
    const stockValue = filteredProducts.reduce(
      (sum, product) => sum + (parseFloat(product.stockQuantity) * parseFloat(product.costPrice || 0)), 
      0
    );

    // Summary statistics
    const summary = {
      totalProducts: filteredProducts.length,
      totalItems: filteredProducts.reduce((sum, p) => sum + parseFloat(p.stockQuantity), 0),
      totalValue: stockValue,
      lowStockItems: filteredProducts.filter(p => 
        p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0
      ).length,
      outOfStockItems: filteredProducts.filter(p => p.stockQuantity <= 0).length,
      categories: [...new Set(filteredProducts.map(p => p.category))]
    };

    res.status(200).json({
      success: true,
      data: {
        products: filteredProducts,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get current stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current stock'
    });
  }
};

// ==================== STOCK MOVEMENT REPORT ====================
exports.getStockMovement = async (req, res) => {
  try {
    const { productId, startDate, endDate, warehouseId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        stockQuantity: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Build where condition
    const where = {
      productId: parseInt(productId)
    };

    if (warehouseId) {
      where.OR = [
        { warehouseId: parseInt(warehouseId) },
        { fromWarehouseId: parseInt(warehouseId) },
        { toWarehouseId: parseInt(warehouseId) }
      ];
    }

    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const transactions = await prisma.stockTransaction.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true
          }
        },
        fromWarehouse: {
          select: {
            id: true,
            name: true
          }
        },
        toWarehouse: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        transactionDate: 'asc'
      }
    });

    // Calculate opening balance (stock before startDate)
    let openingBalance = 0;
    if (startDate) {
      const openingTransactions = await prisma.stockTransaction.findMany({
        where: {
          productId: parseInt(productId),
          transactionDate: {
            lt: new Date(startDate)
          }
        }
      });

      openingTransactions.forEach(transaction => {
        if (transaction.transactionType === 'Purchase' || 
            transaction.transactionType === 'Adjustment-Increase' ||
            transaction.transactionType === 'Transfer-In') {
          openingBalance += parseFloat(transaction.quantity);
        } else if (transaction.transactionType === 'Sale' ||
                   transaction.transactionType === 'Adjustment-Decrease' ||
                   transaction.transactionType === 'Transfer-Out' ||
                   transaction.transactionType === 'Return') {
          openingBalance -= parseFloat(transaction.quantity);
        }
      });
    }

    // Calculate movement summary
    let runningBalance = openingBalance;
    const movementData = transactions.map(transaction => {
      let quantityChange = 0;
      
      if (transaction.transactionType === 'Purchase' || 
          transaction.transactionType === 'Adjustment-Increase' ||
          transaction.transactionType === 'Transfer-In') {
        quantityChange = parseFloat(transaction.quantity);
        runningBalance += quantityChange;
      } else if (transaction.transactionType === 'Sale' ||
                 transaction.transactionType === 'Adjustment-Decrease' ||
                 transaction.transactionType === 'Transfer-Out' ||
                 transaction.transactionType === 'Return') {
        quantityChange = -parseFloat(transaction.quantity);
        runningBalance += quantityChange; // Negative addition
      }

      return {
        ...transaction,
        quantityChange,
        balance: runningBalance
      };
    });

    // Summary by transaction type
    const summaryByType = transactions.reduce((acc, transaction) => {
      const type = transaction.transactionType;
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          quantity: 0,
          value: 0
        };
      }
      acc[type].count += 1;
      acc[type].quantity += parseFloat(transaction.quantity);
      acc[type].value += parseFloat(transaction.totalValue || 0);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        product,
        period: {
          startDate,
          endDate
        },
        openingBalance,
        closingBalance: runningBalance,
        currentStock: parseFloat(product.stockQuantity),
        movements: movementData,
        summary: {
          totalTransactions: transactions.length,
          byType: summaryByType
        }
      }
    });

  } catch (error) {
    console.error('Get stock movement error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock movement report'
    });
  }
};

// ==================== STOCK ADJUSTMENT ====================
exports.createStockAdjustment = async (req, res) => {
  try {
    const {
      adjustmentDate,
      adjustmentType, // Increase or Decrease
      productId,
      adjustedQty,
      reason,
      notes,
      warehouseId = 1
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId || 1;

    // Validate required fields
    if (!productId || !adjustedQty || !reason || !adjustmentType) {
      return res.status(400).json({
        success: false,
        error: 'Product, quantity, reason and adjustment type are required'
      });
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Check if decreasing more than available stock
    if (adjustmentType === 'Decrease' && parseFloat(adjustedQty) > product.stockQuantity) {
      return res.status(400).json({
        success: false,
        error: `Cannot decrease more than available stock. Available: ${product.stockQuantity}`
      });
    }

    // Generate adjustment number
    const adjustmentNo = await generateStockNumber('ADJ');

    // Calculate values
    const previousQty = product.stockQuantity;
    const adjustedQuantity = parseFloat(adjustedQty);
    const newQty = adjustmentType === 'Increase' 
      ? previousQty + adjustedQuantity 
      : previousQty - adjustedQuantity;
    const difference = adjustmentType === 'Increase' ? adjustedQuantity : -adjustedQuantity;
    const unitCost = product.costPrice;
    const totalValue = adjustedQuantity * unitCost;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock adjustment
      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustmentDate: adjustmentDate ? new Date(adjustmentDate) : new Date(),
          adjustmentNo,
          adjustmentType,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit,
          previousQty,
          adjustedQty: adjustedQuantity,
          newQty,
          difference,
          unitCost,
          totalValue,
          reason,
          notes,
          warehouseId,
          status: 'approved',
          branchId,
          createdById: userId,
          approvedById: userId,
          approvedAt: new Date()
        }
      });

      // Update product stock
      await tx.product.update({
        where: { id: product.id },
        data: {
          stockQuantity: newQty
        }
      });

      // Create stock transaction record
      const transactionType = adjustmentType === 'Increase' ? 'Adjustment-Increase' : 'Adjustment-Decrease';
      await tx.stockTransaction.create({
        data: {
          transactionDate: new Date(),
          transactionNo: `TRX-${adjustmentNo}`,
          transactionType,
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit,
          quantity: adjustedQuantity,
          unitPrice: unitCost,
          totalValue,
          warehouseId,
          referenceType: 'StockAdjustment',
          referenceId: adjustment.id,
          referenceNo: adjustmentNo,
          status: 'completed',
          notes: `${adjustmentType} - ${reason}`,
          branchId,
          createdById: userId
        }
      });

      return adjustment;
    });

    res.status(201).json({
      success: true,
      message: 'Stock adjustment created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create stock adjustment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stock adjustment',
      details: error.message
    });
  }
};

// ==================== STOCK TRANSFER ====================
exports.createStockTransfer = async (req, res) => {
  try {
    const {
      transferDate,
      fromWarehouseId,
      toWarehouseId,
      items,
      notes
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId || 1;

    // Validate required fields
    if (!fromWarehouseId || !toWarehouseId || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'From warehouse, to warehouse and items are required'
      });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({
        success: false,
        error: 'Source and destination warehouses cannot be the same'
      });
    }

    // Check warehouses exist
    const [fromWarehouse, toWarehouse] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: parseInt(fromWarehouseId) } }),
      prisma.warehouse.findUnique({ where: { id: parseInt(toWarehouseId) } })
    ]);

    if (!fromWarehouse || !toWarehouse) {
      return res.status(404).json({
        success: false,
        error: 'Warehouse not found'
      });
    }

    // Validate items
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.productId}`
        });
      }

      // Check if enough stock in source warehouse
      // Note: This is simplified - in real system, you'd track stock by warehouse
      if (parseFloat(item.quantity) > product.stockQuantity) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`
        });
      }
    }

    // Generate transfer number
    const transferNo = await generateStockNumber('TRF');

    // Calculate totals
    let totalQuantity = 0;
    let totalValue = 0;
    const transferItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      const quantity = parseFloat(item.quantity);
      const unitCost = product.costPrice;
      const itemValue = quantity * unitCost;

      totalQuantity += quantity;
      totalValue += itemValue;

      transferItems.push({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit,
        quantity,
        unitCost,
        totalValue: itemValue,
        status: 'pending'
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create stock transfer
      const transfer = await tx.stockTransfer.create({
        data: {
          transferDate: transferDate ? new Date(transferDate) : new Date(),
          transferNo,
          fromWarehouseId: parseInt(fromWarehouseId),
          toWarehouseId: parseInt(toWarehouseId),
          totalItems: items.length,
          totalQuantity,
          totalValue,
          status: 'pending',
          notes,
          branchId,
          createdById: userId,
          items: {
            create: transferItems
          }
        },
        include: {
          items: true,
          fromWarehouse: true,
          toWarehouse: true
        }
      });

      // Create outgoing stock transactions
      for (const item of transfer.items) {
        await tx.stockTransaction.create({
          data: {
            transactionDate: new Date(),
            transactionNo: `OUT-${transferNo}`,
            transactionType: 'Transfer-Out',
            productId: item.productId,
            productCode: item.productCode,
            productName: item.productName,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitCost,
            totalValue: item.totalValue,
            fromWarehouseId: parseInt(fromWarehouseId),
            toWarehouseId: parseInt(toWarehouseId),
            referenceType: 'StockTransfer',
            referenceId: transfer.id,
            referenceNo: transferNo,
            status: 'completed',
            notes: `Transfer to ${toWarehouse.name}`,
            branchId,
            createdById: userId
          }
        });

        // Reduce stock from source warehouse (simplified)
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return transfer;
    });

    res.status(201).json({
      success: true,
      message: 'Stock transfer created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create stock transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create stock transfer',
      details: error.message
    });
  }
};

// ==================== RECEIVE STOCK TRANSFER ====================
exports.receiveStockTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems, notes } = req.body;
    const userId = req.user?.id;

    // Get transfer
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true
          }
        },
        fromWarehouse: true,
        toWarehouse: true
      }
    });

    if (!transfer) {
      return res.status(404).json({
        success: false,
        error: 'Stock transfer not found'
      });
    }

    if (transfer.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Transfer already completed'
      });
    }

    // Validate received items
    for (const receivedItem of receivedItems) {
      const transferItem = transfer.items.find(item => item.id === receivedItem.itemId);
      
      if (!transferItem) {
        return res.status(400).json({
          success: false,
          error: `Transfer item not found: ${receivedItem.itemId}`
        });
      }

      if (receivedItem.receivedQty > transferItem.quantity) {
        return res.status(400).json({
          success: false,
          error: `Received quantity exceeds transferred quantity for ${transferItem.productName}`
        });
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update transfer items status
      for (const receivedItem of receivedItems) {
        const receivedQty = parseFloat(receivedItem.receivedQty);
        const transferItem = transfer.items.find(item => item.id === receivedItem.itemId);
        
        await tx.stockTransferItem.update({
          where: { id: receivedItem.itemId },
          data: {
            status: receivedQty === transferItem.quantity ? 'received' : 'partial'
          }
        });

        // Create incoming stock transaction
        await tx.stockTransaction.create({
          data: {
            transactionDate: new Date(),
            transactionNo: `IN-${transfer.transferNo}`,
            transactionType: 'Transfer-In',
            productId: transferItem.productId,
            productCode: transferItem.productCode,
            productName: transferItem.productName,
            unit: transferItem.unit,
            quantity: receivedQty,
            unitPrice: transferItem.unitCost,
            totalValue: receivedQty * transferItem.unitCost,
            fromWarehouseId: transfer.fromWarehouseId,
            toWarehouseId: transfer.toWarehouseId,
            warehouseId: transfer.toWarehouseId,
            referenceType: 'StockTransfer',
            referenceId: transfer.id,
            referenceNo: transfer.transferNo,
            status: 'completed',
            notes: `Received from ${transfer.fromWarehouse.name}`,
            branchId: transfer.branchId,
            createdById: userId
          }
        });

        // Add stock to destination warehouse
        await tx.product.update({
          where: { id: transferItem.productId },
          data: {
            stockQuantity: {
              increment: receivedQty
            }
          }
        });
      }

      // Check if all items received
      const allItemsReceived = transfer.items.every(item => 
        receivedItems.find(ri => ri.itemId === item.id && 
          parseFloat(ri.receivedQty) === item.quantity)
      );

      // Update transfer status
      const updatedTransfer = await tx.stockTransfer.update({
        where: { id: parseInt(id) },
        data: {
          status: allItemsReceived ? 'completed' : 'partial',
          receivedById: userId,
          receivedAt: new Date(),
          notes: notes || transfer.notes
        },
        include: {
          items: true,
          fromWarehouse: true,
          toWarehouse: true
        }
      });

      return updatedTransfer;
    });

    res.status(200).json({
      success: true,
      message: 'Stock transfer received successfully',
      data: result
    });

  } catch (error) {
    console.error('Receive stock transfer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to receive stock transfer'
    });
  }
};

// ==================== STOCK ALERTS ====================
exports.getStockAlerts = async (req, res) => {
  try {
    const {
      alertType,
      status = 'active',
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const branchId = req.user?.branchId;

    const where = {};
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (alertType) {
      where.alertType = alertType;
    }

    if (status) {
      where.status = status;
    }

    const [alerts, total] = await Promise.all([
      prisma.stockAlert.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              code: true,
              name: true,
              unit: true,
              reorderLevel: true,
              alertQuantity: true
            }
          }
        },
        orderBy: {
          alertDate: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.stockAlert.count({ where })
    ]);

    // Summary by alert type
    const summary = await prisma.stockAlert.groupBy({
      by: ['alertType', 'status'],
      where: { branchId },
      _count: {
        id: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        alerts,
        summary,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get stock alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stock alerts'
    });
  }
};

// ==================== GENERATE STOCK ALERTS ====================
exports.generateStockAlerts = async (req, res) => {
  try {
    const branchId = req.user?.branchId || 1;
    const userId = req.user?.id;

    // Get all active products
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        branchId
      },
      select: {
        id: true,
        code: true,
        name: true,
        stockQuantity: true,
        reorderLevel: true,
        alertQuantity: true
      }
    });

    const generatedAlerts = [];

    for (const product of products) {
      const currentStock = parseFloat(product.stockQuantity);
      const reorderLevel = parseFloat(product.reorderLevel);
      const alertQuantity = parseFloat(product.alertQuantity);

      // Check for low stock
      if (currentStock > 0 && currentStock <= reorderLevel) {
        // Check if active alert already exists
        const existingAlert = await prisma.stockAlert.findFirst({
          where: {
            productId: product.id,
            alertType: 'low_stock',
            status: 'active',
            branchId
          }
        });

        if (!existingAlert) {
          const alert = await prisma.stockAlert.create({
            data: {
              alertDate: new Date(),
              alertType: 'low_stock',
              productId: product.id,
              productCode: product.code,
              productName: product.name,
              currentStock,
              alertLevel: reorderLevel,
              status: 'active',
              notes: `Stock below reorder level (${reorderLevel})`,
              branchId,
              createdById: userId
            }
          });
          generatedAlerts.push(alert);
        }
      }

      // Check for out of stock
      if (currentStock <= 0) {
        const existingAlert = await prisma.stockAlert.findFirst({
          where: {
            productId: product.id,
            alertType: 'out_of_stock',
            status: 'active',
            branchId
          }
        });

        if (!existingAlert) {
          const alert = await prisma.stockAlert.create({
            data: {
              alertDate: new Date(),
              alertType: 'out_of_stock',
              productId: product.id,
              productCode: product.code,
              productName: product.name,
              currentStock,
              alertLevel: 0,
              status: 'active',
              notes: 'Product out of stock',
              branchId,
              createdById: userId
            }
          });
          generatedAlerts.push(alert);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generatedAlerts.length} new stock alerts`,
      data: {
        generated: generatedAlerts.length,
        alerts: generatedAlerts
      }
    });

  } catch (error) {
    console.error('Generate stock alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate stock alerts'
    });
  }
};

// ==================== UPDATE STOCK ALERT STATUS ====================
exports.updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;

    const alert = await prisma.stockAlert.findUnique({
      where: { id: parseInt(id) }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Stock alert not found'
      });
    }

    const updatedAlert = await prisma.stockAlert.update({
      where: { id: parseInt(id) },
      data: {
        status,
        notes: notes || alert.notes,
        resolvedById: status === 'resolved' ? userId : null,
        resolvedAt: status === 'resolved' ? new Date() : null
      }
    });

    res.status(200).json({
      success: true,
      message: 'Stock alert status updated',
      data: updatedAlert
    });

  } catch (error) {
    console.error('Update alert status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update alert status'
    });
  }
};

// ==================== PHYSICAL STOCK COUNT ====================
exports.createPhysicalStock = async (req, res) => {
  try {
    const {
      countDate,
      warehouseId,
      notes
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId || 1;

    if (!warehouseId) {
      return res.status(400).json({
        success: false,
        error: 'Warehouse is required'
      });
    }

    // Check warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parseInt(warehouseId) }
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        error: 'Warehouse not found'
      });
    }

    // Get all products for this warehouse
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        branchId
      },
      select: {
        id: true,
        code: true,
        name: true,
        unit: true,
        stockQuantity: true,
        costPrice: true
      }
    });

    if (products.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No products found for stock count'
      });
    }

    // Generate count number
    const countNo = await generateStockNumber('PHY');

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create physical stock count
      const physicalStock = await tx.physicalStock.create({
        data: {
          countDate: countDate ? new Date(countDate) : new Date(),
          countNo,
          warehouseId: parseInt(warehouseId),
          totalItems: products.length,
          itemsCounted: 0,
          varianceCount: 0,
          totalVariance: 0,
          status: 'counting',
          notes,
          branchId,
          createdById: userId,
          items: {
            create: products.map(product => ({
              productId: product.id,
              productCode: product.code,
              productName: product.name,
              unit: product.unit,
              systemQty: product.stockQuantity,
              physicalQty: 0, // To be filled during counting
              varianceQty: 0,
              varianceValue: 0,
              unitCost: product.costPrice,
              status: 'not_counted'
            }))
          }
        },
        include: {
          items: true,
          warehouse: true
        }
      });

      return physicalStock;
    });

    res.status(201).json({
      success: true,
      message: 'Physical stock count created successfully',
      data: result
    });

  } catch (error) {
    console.error('Create physical stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create physical stock count',
      details: error.message
    });
  }
};

// ==================== UPDATE PHYSICAL COUNT ITEM ====================
exports.updatePhysicalCountItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, physicalQty } = req.body;
    const userId = req.user?.id;

    // Get physical stock count
    const physicalStock = await prisma.physicalStock.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: true
      }
    });

    if (!physicalStock) {
      return res.status(404).json({
        success: false,
        error: 'Physical stock count not found'
      });
    }

    if (physicalStock.status !== 'counting') {
      return res.status(400).json({
        success: false,
        error: 'Stock count is not in counting status'
      });
    }

    // Find the item
    const item = physicalStock.items.find(i => i.id === parseInt(itemId));
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in stock count'
      });
    }

    const physicalQuantity = parseFloat(physicalQty);
    const varianceQty = physicalQuantity - parseFloat(item.systemQty);
    const varianceValue = varianceQty * parseFloat(item.unitCost);

    // Update the item
    const updatedItem = await prisma.physicalStockItem.update({
      where: { id: parseInt(itemId) },
      data: {
        physicalQty: physicalQuantity,
        varianceQty,
        varianceValue,
        status: 'counted'
      }
    });

    // Update physical stock summary
    const updatedItems = await prisma.physicalStockItem.findMany({
      where: { physicalStockId: parseInt(id) }
    });

    const itemsCounted = updatedItems.filter(i => i.status === 'counted').length;
    const varianceCount = updatedItems.filter(i => Math.abs(i.varianceQty) > 0).length;
    const totalVariance = updatedItems.reduce((sum, i) => sum + parseFloat(i.varianceValue), 0);

    await prisma.physicalStock.update({
      where: { id: parseInt(id) },
      data: {
        itemsCounted,
        varianceCount,
        totalVariance
      }
    });

    res.status(200).json({
      success: true,
      message: 'Physical count item updated',
      data: updatedItem
    });

  } catch (error) {
    console.error('Update physical count item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update physical count item'
    });
  }
};

// ==================== COMPLETE PHYSICAL STOCK COUNT ====================
exports.completePhysicalStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { applyAdjustments = false } = req.body;
    const userId = req.user?.id;

    // Get physical stock count with items
    const physicalStock = await prisma.physicalStock.findUnique({
      where: { id: parseInt(id) },
      include: {
        items: {
          include: {
            product: true
          }
        },
        warehouse: true
      }
    });

    if (!physicalStock) {
      return res.status(404).json({
        success: false,
        error: 'Physical stock count not found'
      });
    }

    if (physicalStock.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Stock count already completed'
      });
    }

    // Check if all items counted
    const notCountedItems = physicalStock.items.filter(i => i.status !== 'counted');
    if (notCountedItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: `There are ${notCountedItems.length} items not counted yet`
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update physical stock status
      const updatedPhysicalStock = await tx.physicalStock.update({
        where: { id: parseInt(id) },
        data: {
          status: 'completed',
          approvedById: userId,
          approvedAt: new Date()
        }
      });

      // Apply stock adjustments if requested
      if (applyAdjustments) {
        for (const item of physicalStock.items) {
          const variance = parseFloat(item.varianceQty);
          
          if (variance !== 0) {
            const adjustmentType = variance > 0 ? 'Increase' : 'Decrease';
            const adjustedQty = Math.abs(variance);
            const reason = `Physical stock count variance - ${physicalStock.countNo}`;

            // Create stock adjustment
            await tx.stockAdjustment.create({
              data: {
                adjustmentDate: new Date(),
                adjustmentNo: `ADJ-PHY-${physicalStock.countNo}`,
                adjustmentType,
                productId: item.productId,
                productCode: item.productCode,
                productName: item.productName,
                unit: item.unit,
                previousQty: parseFloat(item.systemQty),
                adjustedQty,
                newQty: parseFloat(item.physicalQty),
                difference: variance,
                unitCost: parseFloat(item.unitCost),
                totalValue: Math.abs(parseFloat(item.varianceValue)),
                reason,
                notes: `From physical stock count ${physicalStock.countNo}`,
                warehouseId: physicalStock.warehouseId,
                status: 'approved',
                branchId: physicalStock.branchId,
                createdById: userId,
                approvedById: userId,
                approvedAt: new Date()
              }
            });

            // Update product stock
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: parseFloat(item.physicalQty)
              }
            });

            // Create stock transaction
            const transactionType = adjustmentType === 'Increase' ? 'Adjustment-Increase' : 'Adjustment-Decrease';
            await tx.stockTransaction.create({
              data: {
                transactionDate: new Date(),
                transactionNo: `TRX-PHY-${physicalStock.countNo}`,
                transactionType,
                productId: item.productId,
                productCode: item.productCode,
                productName: item.productName,
                unit: item.unit,
                quantity: adjustedQty,
                unitPrice: parseFloat(item.unitCost),
                totalValue: Math.abs(parseFloat(item.varianceValue)),
                warehouseId: physicalStock.warehouseId,
                referenceType: 'PhysicalStock',
                referenceId: physicalStock.id,
                referenceNo: physicalStock.countNo,
                status: 'completed',
                notes: reason,
                branchId: physicalStock.branchId,
                createdById: userId
              }
            });
          }
        }
      }

      return updatedPhysicalStock;
    });

    res.status(200).json({
      success: true,
      message: `Physical stock count completed${applyAdjustments ? ' and adjustments applied' : ''}`,
      data: result
    });

  } catch (error) {
    console.error('Complete physical stock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete physical stock count'
    });
  }
};

// ==================== STOCK VALUATION REPORT ====================
exports.getStockValuation = async (req, res) => {
  try {
    const { warehouseId = 1, valuationMethod = 'FIFO' } = req.query;
    const branchId = req.user?.branchId;

    // Get products with stock
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { gt: 0 },
        branchId: branchId || 1
      },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        unit: true,
        stockQuantity: true,
        costPrice: true,
        sellPrice: true
      },
      orderBy: {
        category: 'asc'
      }
    });

    // Calculate valuation based on method
    let totalCostValue = 0;
    let totalSellValue = 0;
    
    const valuationData = products.map(product => {
      const stockQty = parseFloat(product.stockQuantity);
      const costPrice = parseFloat(product.costPrice);
      const sellPrice = parseFloat(product.sellPrice);
      
      const costValue = stockQty * costPrice;
      const sellValue = stockQty * sellPrice;
      
      totalCostValue += costValue;
      totalSellValue += sellValue;

      return {
        ...product,
        costValue,
        sellValue,
        profitMargin: sellPrice > 0 ? ((sellPrice - costPrice) / sellPrice * 100).toFixed(2) : 0
      };
    });

    // Group by category
    const byCategory = valuationData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {
          category: item.category,
          items: 0,
          quantity: 0,
          costValue: 0,
          sellValue: 0
        };
      }
      acc[item.category].items += 1;
      acc[item.category].quantity += parseFloat(item.stockQuantity);
      acc[item.category].costValue += item.costValue;
      acc[item.category].sellValue += item.sellValue;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        valuationMethod,
        asOfDate: new Date().toISOString().split('T')[0],
        summary: {
          totalProducts: products.length,
          totalItems: products.reduce((sum, p) => sum + parseFloat(p.stockQuantity), 0),
          totalCostValue,
          totalSellValue,
          totalProfitMargin: totalSellValue > 0 
            ? ((totalSellValue - totalCostValue) / totalSellValue * 100).toFixed(2)
            : 0
        },
        byCategory: Object.values(byCategory),
        products: valuationData
      }
    });

  } catch (error) {
    console.error('Get stock valuation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate stock valuation report'
    });
  }
};

// ==================== STOCK AGING REPORT ====================
exports.getStockAging = async (req, res) => {
  try {
    const { warehouseId = 1 } = req.query;
    const branchId = req.user?.branchId;

    // Get products with stock and last movement
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQuantity: { gt: 0 },
        branchId: branchId || 1
      },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        unit: true,
        stockQuantity: true,
        costPrice: true
      }
    });

    const agingData = [];
    const today = new Date();

    for (const product of products) {
      // Get last purchase date for this product
      const lastPurchase = await prisma.stockTransaction.findFirst({
        where: {
          productId: product.id,
          transactionType: 'Purchase',
          branchId: branchId || 1
        },
        orderBy: {
          transactionDate: 'desc'
        },
        select: {
          transactionDate: true,
          quantity: true
        }
      });

      const lastSale = await prisma.stockTransaction.findFirst({
        where: {
          productId: product.id,
          transactionType: 'Sale',
          branchId: branchId || 1
        },
        orderBy: {
          transactionDate: 'desc'
        },
        select: {
          transactionDate: true,
          quantity: true
        }
      });

      const lastDate = lastPurchase?.transactionDate || product.createdAt;
      const daysInStock = Math.floor((today - new Date(lastDate)) / (1000 * 60 * 60 * 24));
      
      let agingCategory = 'Current';
      if (daysInStock > 180) agingCategory = '> 6 Months';
      else if (daysInStock > 90) agingCategory = '3-6 Months';
      else if (daysInStock > 30) agingCategory = '1-3 Months';
      else if (daysInStock > 7) agingCategory = '7-30 Days';

      const stockValue = parseFloat(product.stockQuantity) * parseFloat(product.costPrice);

      agingData.push({
        ...product,
        lastPurchaseDate: lastPurchase?.transactionDate,
        lastSaleDate: lastSale?.transactionDate,
        daysInStock,
        agingCategory,
        stockValue
      });
    }

    // Group by aging category
    const byAging = agingData.reduce((acc, item) => {
      if (!acc[item.agingCategory]) {
        acc[item.agingCategory] = {
          category: item.agingCategory,
          items: 0,
          quantity: 0,
          value: 0
        };
      }
      acc[item.agingCategory].items += 1;
      acc[item.agingCategory].quantity += parseFloat(item.stockQuantity);
      acc[item.agingCategory].value += item.stockValue;
      return acc;
    }, {});

    // Sort by days in stock (descending)
    agingData.sort((a, b) => b.daysInStock - a.daysInStock);

    const totalValue = agingData.reduce((sum, item) => sum + item.stockValue, 0);

    res.status(200).json({
      success: true,
      data: {
        asOfDate: today.toISOString().split('T')[0],
        summary: {
          totalItems: agingData.length,
          totalValue,
          averageDaysInStock: agingData.length > 0 
            ? (agingData.reduce((sum, item) => sum + item.daysInStock, 0) / agingData.length).toFixed(1)
            : 0
        },
        byAging: Object.values(byAging),
        products: agingData.slice(0, 100) // Limit to first 100 for performance
      }
    });

  } catch (error) {
    console.error('Get stock aging error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate stock aging report'
    });
  }
};