const prisma = require('../lib/prisma');

/**
 * Payment Controller (Generic CRUD)
 * Model: Payment
 *
 * Note:
 * - Sales module already supports adding payments via /sales/:saleId/payment.
 * - These endpoints are for listing/searching payments and creating standalone payments.
 */

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.getPayments = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);

    const search = String(req.query.search || '').trim();
    const status = req.query.status;
    const type = req.query.type;
    const method = req.query.method;

    const where = {};

    if (search) {
      where.OR = [
        { paymentNo: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = String(status);
    if (type) where.type = String(type);
    if (method) where.paymentMethod = String(method);

    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { paymentDate: 'desc' },
        skip,
        take: limit,
        include: {
          sale: { select: { id: true, invoiceNo: true } },
          purchase: { select: { id: true, purchaseNo: true } },
          customer: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } },
          createdBy: { select: { id: true, username: true, fullName: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getPayments error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch payments' });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        sale: { select: { id: true, invoiceNo: true } },
        purchase: { select: { id: true, purchaseNo: true } },
        customer: { select: { id: true, name: true } },
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, username: true, fullName: true } },
      },
    });

    if (!payment) return res.status(404).json({ success: false, error: 'Payment not found' });

    return res.json({ success: true, data: payment });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getPaymentById error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch payment' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const {
      paymentNo,
      paymentDate,
      amount,
      paymentMethod = 'cash',
      reference,
      notes,
      type = 'received',
      status = 'completed',
      saleId,
      purchaseId,
      customerId,
      supplierId,
    } = req.body || {};

    if (amount === undefined || Number(amount) <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }

    if (!saleId && !purchaseId && !customerId && !supplierId) {
      return res.status(400).json({
        success: false,
        error: 'Payment must be linked to a sale, purchase, customer, or supplier',
      });
    }

    const created = await prisma.payment.create({
      data: {
        paymentNo: paymentNo ? String(paymentNo).trim() : undefined,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        amount: Number(amount),
        paymentMethod: String(paymentMethod),
        reference: reference ? String(reference).trim() : null,
        notes: notes ? String(notes).trim() : null,
        type: String(type),
        status: String(status),
        saleId: saleId ? Number(saleId) : null,
        purchaseId: purchaseId ? Number(purchaseId) : null,
        customerId: customerId ? Number(customerId) : null,
        supplierId: supplierId ? Number(supplierId) : null,
        createdById: req.user?.id ? Number(req.user.id) : null,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Payment number already exists' });
    }
    // eslint-disable-next-line no-console
    console.error('createPayment error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create payment' });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await prisma.payment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: 'Payment not found' });

    await prisma.payment.delete({ where: { id } });

    return res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('deletePayment error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete payment' });
  }
};
