const prisma = require('../lib/prisma');
const ExcelJS = require('exceljs');

const toInt = (v, d = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const toDecimal = (v, d = 0) => {
  if (v === null || v === undefined || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

// ==================== GET ALL PRODUCTS ====================
exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      supplier = '',
      minPrice = '',
      maxPrice = '',
      lowStock = '',
      status = 'active',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const branchId = req.user?.branchId || req.branchId || 1;
    const skip = (toInt(page, 1) - 1) * toInt(limit, 20);

    const where = { branchId };

    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;

    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { code: { contains: String(search), mode: 'insensitive' } },
        { brand: { contains: String(search), mode: 'insensitive' } },
        { model: { contains: String(search), mode: 'insensitive' } },
        { barcode: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (category) where.categoryId = toInt(category);
    if (supplier) where.supplierId = toInt(supplier);

    if (minPrice || maxPrice) {
      where.sellPrice = {};
      if (minPrice) where.sellPrice.gte = toDecimal(minPrice);
      if (maxPrice) where.sellPrice.lte = toDecimal(maxPrice);
    }

    // Prisma can't compare two columns easily (stockQuantity <= reorderLevel),
    // so we do a two-step approach when lowStock is requested.
    const orderBy = { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' };

    let products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, code: true } },
        supplier: { select: { id: true, name: true, code: true } },
      },
      orderBy,
      skip,
      take: toInt(limit, 20),
    });

    if (lowStock === 'true' || lowStock === true) {
      products = products.filter((p) => Number(p.stockQuantity) <= Number(p.reorderLevel));
    }

    const total = await prisma.product.count({ where });

    return res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: toInt(page, 1),
        limit: toInt(limit, 20),
        total,
        pages: Math.ceil(total / toInt(limit, 20)),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

// ==================== GET PRODUCT BY ID ====================
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user?.branchId || req.branchId || 1;

    const product = await prisma.product.findFirst({
      where: { id: toInt(id), branchId },
      include: {
        category: true,
        supplier: true,
        purchaseItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { purchase: true },
        },
        saleItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { sale: true },
        },
      },
    });

    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    // Build stock movement list using Prisma (no raw SQL)
    const movements = [];

    for (const si of product.saleItems || []) {
      if (si.sale?.status !== 'completed') continue;
      movements.push({
        type: 'sale',
        date: si.sale.invoiceDate,
        reference: si.sale.invoiceNumber,
        quantity: si.quantity,
        price: si.unitPrice,
        total: si.totalPrice,
        description: 'Sale',
      });
    }

    for (const pi of product.purchaseItems || []) {
      if (pi.purchase?.status !== 'received' && pi.purchase?.status !== 'completed') continue;
      movements.push({
        type: 'purchase',
        date: pi.purchase.invoiceDate,
        reference: pi.purchase.invoiceNumber,
        quantity: pi.orderedQty,
        price: pi.unitCost,
        total: pi.totalCost,
        description: 'Purchase',
      });
    }

    movements.sort((a, b) => new Date(b.date) - new Date(a.date));

    return res.status(200).json({
      success: true,
      data: {
        ...product,
        stockMovements: movements.slice(0, 100),
      },
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
};

// ==================== CREATE PRODUCT ====================
exports.createProduct = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const userId = req.userId || req.user?.id || null;

    const {
      code,
      name,
      description,
      categoryId,
      supplierId,
      brand,
      model,
      origin,
      unit,
      barcode,
      costPrice,
      sellPrice,
      wholesalePrice,
      minPrice,
      taxRate,
      hasVAT,
      openingStock,
      reorderLevel,
      alertQuantity,
      isService,
      isActive,
      images,
      hasBatch,
      hasSerial,
      hasExpiry,
      warrantyMonths,
      minSellingPrice,
      maxDiscount,
    } = req.body;

    if (!code || !name || !categoryId || costPrice === undefined || sellPrice === undefined) {
      return res.status(400).json({
        success: false,
        error: 'code, name, categoryId, costPrice and sellPrice are required',
      });
    }

    const existing = await prisma.product.findFirst({
      where: { branchId, OR: [{ code: String(code) }, ...(barcode ? [{ barcode: String(barcode) }] : [])] },
      select: { id: true },
    });

    if (existing) {
      return res.status(409).json({ success: false, error: 'Product code/barcode already exists' });
    }

    const product = await prisma.product.create({
      data: {
        branchId,
        createdById: userId,
        updatedById: userId,

        code: String(code),
        name: String(name),
        description: description || null,

        categoryId: toInt(categoryId),
        supplierId: supplierId ? toInt(supplierId) : null,

        brand: brand || null,
        model: model || null,
        origin: origin || null,
        unit: unit || 'piece',

        barcode: barcode || null,
        images: images || null,

        costPrice: toDecimal(costPrice),
        sellPrice: toDecimal(sellPrice),
        wholesalePrice: wholesalePrice !== undefined ? toDecimal(wholesalePrice, null) : null,
        minPrice: minPrice !== undefined ? toDecimal(minPrice, null) : null,

        taxRate: toDecimal(taxRate, 0),
        hasVAT: Boolean(hasVAT),

        openingStock: toDecimal(openingStock, 0),
        stockQuantity: toDecimal(openingStock, 0),
        reorderLevel: toDecimal(reorderLevel, 10),
        alertQuantity: toDecimal(alertQuantity, 5),

        isService: Boolean(isService),
        isActive: isActive !== undefined ? Boolean(isActive) : true,

        hasBatch: Boolean(hasBatch),
        hasSerial: Boolean(hasSerial),
        hasExpiry: Boolean(hasExpiry),

        warrantyMonths: warrantyMonths !== undefined ? toInt(warrantyMonths, null) : null,
        minSellingPrice: minSellingPrice !== undefined ? toDecimal(minSellingPrice, null) : null,
        maxDiscount: maxDiscount !== undefined ? toDecimal(maxDiscount, null) : null,
      },
      include: {
        category: true,
        supplier: true,
      },
    });

    return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    console.error('Create product error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  }
};

// ==================== UPDATE PRODUCT ====================
exports.updateProduct = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const userId = req.userId || req.user?.id || null;
    const { id } = req.params;

    const existing = await prisma.product.findFirst({
      where: { id: Number(id), branchId },
      select: { id: true },
    });

    if (!existing) return res.status(404).json({ success: false, error: 'Product not found' });

    const payload = { ...req.body };

    const numericFields = [
      'costPrice','sellPrice','wholesalePrice','minPrice','taxRate',
      'openingStock','stockQuantity','reorderLevel','alertQuantity','warrantyMonths',
      'minSellingPrice','maxDiscount'
    ];
    for (const f of numericFields) {
      if (payload[f] !== undefined && payload[f] !== null && payload[f] !== '') {
        payload[f] = f === 'warrantyMonths' ? toInt(payload[f], null) : toDecimal(payload[f], null);
      }
    }

    if (payload.categoryId !== undefined) payload.categoryId = toInt(payload.categoryId);
    if (payload.supplierId !== undefined) payload.supplierId = payload.supplierId ? toInt(payload.supplierId) : null;

    payload.updatedById = userId;

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: payload,
      include: { category: true, supplier: true },
    });

    return res.status(200).json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error) {
    console.error('Update product error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  }
};

// ==================== DELETE PRODUCT ====================
exports.deleteProduct = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id: Number(id), branchId },
      select: { id: true },
    });

    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { isActive: false },
    });

    return res.status(200).json({ success: true, message: 'Product deactivated successfully', data: updated });
  } catch (error) {
    console.error('Delete product error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
};

// ==================== UPDATE STOCK ====================
exports.updateStock = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const userId = req.userId || req.user?.id || null;
    const { id } = req.params;
    const { quantity, type = 'adjustment', note = '' } = req.body;

    if (quantity === undefined) return res.status(400).json({ success: false, error: 'quantity is required' });

    const product = await prisma.product.findFirst({
      where: { id: Number(id), branchId },
    });

    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    const qty = toDecimal(quantity);
    let newStock = Number(product.stockQuantity);

    if (type === 'in') newStock += qty;
    else if (type === 'out') newStock -= qty;
    else newStock = qty;

    if (newStock < 0) return res.status(400).json({ success: false, error: 'Stock cannot be negative' });

    const updated = await prisma.product.update({
      where: { id: product.id },
      data: { stockQuantity: newStock, updatedById: userId },
    });

    return res.status(200).json({ success: true, message: 'Stock updated successfully', data: updated });
  } catch (error) {
    console.error('Update stock error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update stock' });
  }
};

// ==================== GET PRODUCTS BY CATEGORY ====================
exports.getProductsByCategory = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const { categoryId } = req.params;

    const products = await prisma.product.findMany({
      where: { branchId, categoryId: Number(categoryId), isActive: true },
      orderBy: { name: 'asc' },
      include: { category: true, supplier: true },
    });

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get products by category error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch products by category' });
  }
};

// ==================== GET LOW STOCK PRODUCTS ====================
exports.getLowStockProducts = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;

    const products = await prisma.product.findMany({
      where: { branchId, isActive: true, isService: false },
      select: {
        id: true,
        code: true,
        name: true,
        stockQuantity: true,
        reorderLevel: true,
        alertQuantity: true,
        sellPrice: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
      take: 5000,
    });

    const low = products
      .filter((p) => Number(p.stockQuantity) <= Number(p.reorderLevel))
      .map((p) => ({ ...p, shortage: Number(p.reorderLevel) - Number(p.stockQuantity) }));

    return res.status(200).json({ success: true, data: low, count: low.length });
  } catch (error) {
    console.error('Get low stock products error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch low stock products' });
  }
};

// ==================== EXPORT PRODUCTS ====================
exports.exportProducts = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;

    const products = await prisma.product.findMany({
      where: { branchId },
      include: {
        category: { select: { name: true, code: true } },
        supplier: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Products');

    sheet.columns = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Name', key: 'name', width: 35 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Supplier', key: 'supplier', width: 20 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'Model', key: 'model', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Barcode', key: 'barcode', width: 20 },
      { header: 'Cost Price', key: 'costPrice', width: 12 },
      { header: 'Sell Price', key: 'sellPrice', width: 12 },
      { header: 'Stock', key: 'stockQuantity', width: 10 },
      { header: 'Reorder', key: 'reorderLevel', width: 10 },
      { header: 'Active', key: 'isActive', width: 10 },
    ];

    products.forEach((p) => {
      sheet.addRow({
        code: p.code,
        name: p.name,
        category: p.category?.name || '',
        supplier: p.supplier?.name || '',
        brand: p.brand || '',
        model: p.model || '',
        unit: p.unit || '',
        barcode: p.barcode || '',
        costPrice: Number(p.costPrice),
        sellPrice: Number(p.sellPrice),
        stockQuantity: Number(p.stockQuantity),
        reorderLevel: Number(p.reorderLevel),
        isActive: p.isActive ? 'Yes' : 'No',
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export products error:', error);
    return res.status(500).json({ success: false, error: 'Failed to export products' });
  }
};
