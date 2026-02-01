const prisma = require('../lib/prisma');

const toInt = (v, d = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : d;
};

const toNum = (v, d = 0) => {
  if (v === null || v === undefined || v === '') return d;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const genRef = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// ==================== SUPPLIERS ====================
exports.getSuppliers = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const suppliers = await prisma.supplier.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const { name, phone, email, address, city, openingBalance = 0, supplierType } = req.body;

    if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone are required' });

    const supplier = await prisma.supplier.create({
      data: {
        branchId,
        code: genRef('SUP'),
        name: String(name),
        phone1: String(phone),
        email: email || null,
        address: address || null,
        city: city || null,
        supplierType: supplierType || null,
        openingBalance: toNum(openingBalance, 0),
        currentBalance: toNum(openingBalance, 0),
        isActive: true,
      },
    });

    res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ success: false, error: 'Failed to create supplier' });
  }
};

exports.getSupplierLedger = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const supplierId = toInt(req.params.supplierId);

    const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, branchId } });
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

    const [purchases, payments] = await Promise.all([
      prisma.purchase.findMany({
        where: { supplierId, branchId },
        orderBy: { invoiceDate: 'desc' },
        take: 100,
        select: { id: true, invoiceNumber: true, invoiceDate: true, totalAmount: true, paidAmount: true, dueAmount: true, status: true },
      }),
      prisma.payment.findMany({
        where: { supplierId, branchId, status: 'completed' },
        orderBy: { paymentDate: 'desc' },
        take: 100,
        select: { id: true, referenceNo: true, paymentDate: true, amount: true, paymentMethod: true, notes: true },
      }),
    ]);

    res.json({ success: true, data: { supplier, purchases, payments } });
  } catch (error) {
    console.error('Supplier ledger error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch supplier ledger' });
  }
};

// ==================== PURCHASES ====================
exports.getPurchases = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const { page = 1, limit = 20, search = '', status = '', supplierId = '', from = '', to = '' } = req.query;
    const skip = (toInt(page, 1) - 1) * toInt(limit, 20);

    const where = { branchId };
    if (status) where.status = String(status);
    if (supplierId) where.supplierId = toInt(supplierId);

    if (from || to) {
      where.invoiceDate = {};
      if (from) where.invoiceDate.gte = new Date(from);
      if (to) where.invoiceDate.lte = new Date(to);
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: String(search), mode: 'insensitive' } },
        { supplierName: { contains: String(search), mode: 'insensitive' } },
        { supplierPhone: { contains: String(search) } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.purchase.findMany({
        where,
        include: { supplier: { select: { id: true, name: true, code: true } } },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: toInt(limit, 20),
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({
      success: true,
      data,
      pagination: { page: toInt(page, 1), limit: toInt(limit, 20), total, pages: Math.ceil(total / toInt(limit, 20)) },
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchases' });
  }
};

exports.getPendingPurchases = async (req, res) => {
  try {
    req.query.status = 'pending';
    return exports.getPurchases(req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch pending purchases' });
  }
};

exports.getPurchaseById = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const id = toInt(req.params.id);

    const purchase = await prisma.purchase.findFirst({
      where: { id, branchId },
      include: {
        supplier: true,
        purchaseItems: { include: { product: true } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
    res.json({ success: true, data: purchase });
  } catch (error) {
    console.error('Get purchase by id error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase' });
  }
};

exports.createPurchase = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const userId = req.userId || req.user?.id || null;

    const { supplierId, invoiceDate, items = [], discountAmount = 0, taxAmount = 0, notes, reference } = req.body;

    if (!supplierId) return res.status(400).json({ success: false, error: 'supplierId is required' });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ success: false, error: 'items are required' });

    const supplier = await prisma.supplier.findFirst({ where: { id: toInt(supplierId), branchId } });
    if (!supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

    const productIds = items.map((i) => toInt(i.productId)).filter(Boolean);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, branchId, isActive: true } });
    const productById = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const createItems = [];

    for (const item of items) {
      const productId = toInt(item.productId);
      const product = productById.get(productId);
      if (!product) return res.status(400).json({ success: false, error: `Invalid productId: ${item.productId}` });

      const qty = toNum(item.quantity ?? item.orderedQty, 0);
      const unitCost = toNum(item.unitCost ?? item.costPrice ?? product.costPrice, 0);
      if (qty <= 0) return res.status(400).json({ success: false, error: 'Item quantity must be > 0' });

      const totalCost = qty * unitCost;
      subtotal += totalCost;

      createItems.push({
        productId,
        productCode: product.code,
        productName: product.name,
        unit: item.unit || product.unit || 'piece',
        orderedQty: qty,
        receivedQty: 0,
        unitCost,
        totalCost,
        remarks: item.remarks || null,
      });
    }

    const totalAmount = subtotal - toNum(discountAmount, 0) + toNum(taxAmount, 0);
    const paidAmount = 0;
    const dueAmount = totalAmount;

    const purchase = await prisma.purchase.create({
      data: {
        invoiceNumber: genRef('PUR'),
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        supplierId: supplier.id,
        supplierName: supplier.name,
        supplierPhone: supplier.phone1 || '',
        subtotal,
        discountAmount: toNum(discountAmount, 0),
        taxAmount: toNum(taxAmount, 0),
        totalAmount,
        paidAmount,
        dueAmount,
        status: 'pending',
        paymentStatus: 'unpaid',
        reference: reference || null,
        notes: notes || null,
        branchId,
        createdById: userId,
        purchaseItems: { create: createItems },
      },
      include: { supplier: true, purchaseItems: true },
    });

    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { currentBalance: { increment: dueAmount } },
    });

    res.status(201).json({ success: true, message: 'Purchase created', data: purchase });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ success: false, error: 'Failed to create purchase' });
  }
};

exports.updatePurchase = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const id = toInt(req.params.id);

    const purchase = await prisma.purchase.findFirst({ where: { id, branchId }, include: { purchaseItems: true } });
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
    if (purchase.status !== 'pending' && purchase.status !== 'ordered') {
      return res.status(400).json({ success: false, error: 'Only pending/ordered purchases can be updated' });
    }

    const { discountAmount, taxAmount, notes, reference, status } = req.body;

    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        discountAmount: discountAmount !== undefined ? toNum(discountAmount, 0) : undefined,
        taxAmount: taxAmount !== undefined ? toNum(taxAmount, 0) : undefined,
        notes: notes !== undefined ? notes : undefined,
        reference: reference !== undefined ? reference : undefined,
        status: status !== undefined ? String(status) : undefined,
      },
      include: { supplier: true, purchaseItems: true, payments: true },
    });

    res.json({ success: true, message: 'Purchase updated', data: updated });
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({ success: false, error: 'Failed to update purchase' });
  }
};

exports.receivePurchase = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const userId = req.userId || req.user?.id || null;
    const id = toInt(req.params.id);

    const purchase = await prisma.purchase.findFirst({
      where: { id, branchId },
      include: { purchaseItems: true },
    });
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });
    if (purchase.status === 'received' || purchase.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Purchase already received' });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of purchase.purchaseItems) {
        const qty = Number(item.orderedQty);
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: qty }, updatedById: userId },
        });
        await tx.purchaseItem.update({
          where: { id: item.id },
          data: { receivedQty: qty },
        });
      }

      await tx.purchase.update({
        where: { id },
        data: {
          status: 'received',
          updatedById: userId,
        },
      });
    });

    const updated = await prisma.purchase.findFirst({
      where: { id, branchId },
      include: { supplier: true, purchaseItems: { include: { product: true } } },
    });

    res.json({ success: true, message: 'Purchase marked as received', data: updated });
  } catch (error) {
    console.error('Receive purchase error:', error);
    res.status(500).json({ success: false, error: 'Failed to receive purchase' });
  }
};

exports.cancelPurchase = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const id = toInt(req.params.id);

    const purchase = await prisma.purchase.findFirst({ where: { id, branchId } });
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });

    if (purchase.status === 'received' || purchase.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Received purchases cannot be cancelled' });
    }

    await prisma.purchase.update({ where: { id }, data: { status: 'cancelled' } });

    res.json({ success: true, message: 'Purchase cancelled' });
  } catch (error) {
    console.error('Cancel purchase error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel purchase' });
  }
};

exports.addPurchasePayment = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const userId = req.userId || req.user?.id || null;
    const purchaseId = toInt(req.params.purchaseId);
    const { amount, paymentMethod = 'cash', notes } = req.body;

    const purchase = await prisma.purchase.findFirst({ where: { id: purchaseId, branchId } });
    if (!purchase) return res.status(404).json({ success: false, error: 'Purchase not found' });

    const payAmount = toNum(amount, 0);
    if (payAmount <= 0) return res.status(400).json({ success: false, error: 'amount must be > 0' });
    if (payAmount > Number(purchase.dueAmount)) {
      return res.status(400).json({ success: false, error: 'amount cannot exceed due amount' });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          paymentDate: new Date(),
          referenceNo: genRef('PAY'),
          supplierId: purchase.supplierId,
          purchaseId: purchase.id,
          amount: payAmount,
          paymentMethod,
          status: 'completed',
          notes: notes || null,
          branchId,
          createdById: userId,
        },
      });

      const newPaid = Number(purchase.paidAmount) + payAmount;
      const newDue = Number(purchase.totalAmount) - newPaid;

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          paidAmount: newPaid,
          dueAmount: newDue,
          paymentStatus: newDue === 0 ? 'paid' : 'partial',
        },
      });

      await tx.supplier.update({
        where: { id: purchase.supplierId },
        data: { currentBalance: { decrement: payAmount } },
      });

      return created;
    });

    res.status(201).json({ success: true, message: 'Payment added', data: payment });
  } catch (error) {
    console.error('Add purchase payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add payment' });
  }
};

exports.getPurchaseStatistics = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;

    const agg = await prisma.purchase.aggregate({
      where: { branchId },
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
      _count: { id: true },
    });

    res.json({
      success: true,
      data: {
        totalPurchases: agg._count.id || 0,
        totalAmount: agg._sum.totalAmount || 0,
        totalPaid: agg._sum.paidAmount || 0,
        totalDue: agg._sum.dueAmount || 0,
      },
    });
  } catch (error) {
    console.error('Purchase stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase statistics' });
  }
};

exports.getPurchaseReport = async (req, res) => {
  try {
    const branchId = req.user?.branchId || req.branchId || 1;
    const { from, to } = req.query;

    const where = { branchId };
    if (from || to) {
      where.invoiceDate = {};
      if (from) where.invoiceDate.gte = new Date(from);
      if (to) where.invoiceDate.lte = new Date(to);
    }

    const purchases = await prisma.purchase.findMany({
      where,
      select: { invoiceDate: true, totalAmount: true, paidAmount: true, dueAmount: true, discountAmount: true, taxAmount: true },
      orderBy: { invoiceDate: 'asc' },
      take: 10000,
    });

    const map = new Map();
    for (const p of purchases) {
      const key = new Date(p.invoiceDate);
      key.setHours(0, 0, 0, 0);
      const k = key.toISOString().slice(0, 10);

      const row = map.get(k) || {
        date: k,
        order_count: 0,
        total_purchases: 0,
        total_paid: 0,
        total_due: 0,
        total_discount: 0,
        total_tax: 0,
      };

      row.order_count += 1;
      row.total_purchases += Number(p.totalAmount);
      row.total_paid += Number(p.paidAmount);
      row.total_due += Number(p.dueAmount);
      row.total_discount += Number(p.discountAmount);
      row.total_tax += Number(p.taxAmount);
      map.set(k, row);
    }

    const data = Array.from(map.values()).sort((a, b) => (a.date > b.date ? 1 : -1));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Purchase report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate purchase report' });
  }
};
