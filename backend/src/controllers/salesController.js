// src/controllers/salesController.js

const prisma = require('../lib/prisma');

let generateInvoiceNumber;
try {
  ({ generateInvoiceNumber } = require('../utils/dateUtils'));
} catch (e) {
  // fallback (still works if utils missing)
  generateInvoiceNumber = async (prefix) => `${prefix}-${Date.now()}`;
}

const getBranchId = (req) => Number(req.user?.branchId || 1);

// ==================== CREATE SALE (INVOICE) ====================
exports.createSale = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      items,
      discount = 0,
      tax = 0,
      shipping = 0,
      notes,
      reference,
      paymentMethod,
      paidAmount = 0,
    } = req.body;

    const userId = req.user?.id;
    const branchId = getBranchId(req);

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Sale items are required' });
    }

    const invoiceNumber = await generateInvoiceNumber('SALE');

    let subtotal = 0;
    const saleItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: Number(item.productId) } });
      if (!product) return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });

      if (Number(product.stockQuantity) < Number(item.quantity)) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`,
        });
      }

      const unitPrice = item.unitPrice ? Number(item.unitPrice) : Number(product.sellPrice);
      const costPrice = Number(product.costPrice);
      const qty = Number(item.quantity);

      const totalPrice = unitPrice * qty;
      const profit = (unitPrice - costPrice) * qty;

      subtotal += totalPrice;

      saleItems.push({
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit || null,
        quantity: qty,
        unitPrice,
        costPrice,
        totalPrice,
        profit,
      });
    }

    const totalAmount = subtotal - Number(discount) + Number(tax) + Number(shipping);
    const dueAmount = totalAmount - Number(paidAmount);

    const paymentStatus =
      Number(paidAmount) <= 0 ? 'unpaid' : Number(paidAmount) < totalAmount ? 'partial' : 'paid';

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNumber,
          invoiceDate: new Date(),
          customerId: customerId ? Number(customerId) : null,
          customerName: customerName || 'Walk-in Customer',
          customerPhone: customerPhone || 'N/A',
          subtotal,
          discount: Number(discount),
          tax: Number(tax),
          shipping: Number(shipping),
          totalAmount,
          paidAmount: Number(paidAmount),
          dueAmount,
          status: 'completed',
          paymentStatus,
          notes: notes || null,
          reference: reference || null,
          branchId,
          createdById: userId,
          items: { create: saleItems },
        },
        include: { items: true },
      });

      for (const it of saleItems) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stockQuantity: { decrement: it.quantity } },
        });
      }

      if (created.customerId) {
        await tx.customer.update({
          where: { id: created.customerId },
          data: { currentBalance: { increment: dueAmount } },
        });
      }

      if (Number(paidAmount) > 0 && created.customerId) {
        await tx.payment.create({
          data: {
            paymentDate: new Date(),
            referenceNo: `PAY-${invoiceNumber}`,
            customerId: created.customerId,
            saleId: created.id,
            amount: Number(paidAmount),
            paymentMethod: paymentMethod || 'cash',
            status: 'completed',
            branchId,
            createdById: userId,
          },
        });
      }

      return created;
    });

    res.status(201).json({
      success: true,
      message: 'Sale created successfully',
      data: { sale, invoiceNumber: sale.invoiceNumber, totalAmount: sale.totalAmount, dueAmount: sale.dueAmount },
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ success: false, error: 'Failed to create sale', details: error.message });
  }
};

// ==================== GET SALES LIST ====================
exports.getSalesList = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', startDate, endDate, customerId, status } = req.query;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const branchId = getBranchId(req);

    const where = { branchId };

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }
    if (customerId) where.customerId = Number(customerId);
    if (status) where.status = status;

    if (startDate && endDate) {
      where.invoiceDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        include: { customer: { select: { id: true, name: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit, 10),
      }),
      prisma.sale.count({ where }),
    ]);

    const summary = await prisma.sale.aggregate({
      where,
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    });

    res.status(200).json({
      success: true,
      data: {
        sales,
        pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) },
        summary: {
          totalSales: summary._sum.totalAmount || 0,
          totalPaid: summary._sum.paidAmount || 0,
          totalDue: summary._sum.dueAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get sales list error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sales list' });
  }
};

// ==================== GET SALE BY ID ====================
exports.getSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await prisma.sale.findUnique({
      where: { id: Number(id) },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        items: { include: { product: { select: { id: true, code: true, name: true, unit: true } } } },
        payments: { orderBy: { paymentDate: 'desc' } },
      },
    });

    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    console.error('Get sale by id error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sale details' });
  }
};

// ==================== ADD PAYMENT TO SALE ====================
exports.addPayment = async (req, res) => {
  try {
    const { saleId } = req.params;
    const { amount, paymentMethod = 'cash', bankName, chequeNo, mobileBanking, notes } = req.body;

    const userId = req.user?.id;
    const branchId = getBranchId(req);

    const sale = await prisma.sale.findUnique({ where: { id: Number(saleId) } });
    if (!sale) return res.status(404).json({ success: false, error: 'Sale not found' });

    if (Number(sale.dueAmount) < Number(amount)) {
      return res.status(400).json({ success: false, error: `Payment exceeds due amount. Due: ${sale.dueAmount}` });
    }

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          paymentDate: new Date(),
          referenceNo: `PAY-${sale.invoiceNumber}-${Date.now()}`,
          customerId: sale.customerId,
          saleId: sale.id,
          amount: Number(amount),
          paymentMethod,
          bankName: bankName || null,
          chequeNo: chequeNo || null,
          mobileBanking: mobileBanking || null,
          notes: notes || null,
          status: 'completed',
          branchId,
          createdById: userId,
        },
      });

      const updatedSale = await tx.sale.update({
        where: { id: sale.id },
        data: {
          paidAmount: { increment: Number(amount) },
          dueAmount: { decrement: Number(amount) },
          paymentStatus: Number(sale.dueAmount) - Number(amount) === 0 ? 'paid' : 'partial',
        },
      });

      if (sale.customerId) {
        await tx.customer.update({
          where: { id: sale.customerId },
          data: { currentBalance: { decrement: Number(amount) } },
        });
      }

      return { payment, sale: updatedSale };
    });

    res.status(200).json({ success: true, message: 'Payment added successfully', data: result });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add payment' });
  }
};

// ==================== GET CUSTOMERS ====================
exports.getCustomers = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const branchId = getBranchId(req);

    const where = { isActive: true, branchId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { code: { contains: search } },
        { company: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          company: true,
          phone: true,
          address: true,
          currentBalance: true,
          creditLimit: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: parseInt(limit, 10),
      }),
      prisma.customer.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: { customers, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
};

// ==================== CREATE CUSTOMER ====================
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address, company, area, city, openingBalance, creditLimit } = req.body;
    const branchId = getBranchId(req);

    if (!name || !phone) return res.status(400).json({ success: false, error: 'name and phone required' });

    const last = await prisma.customer.findFirst({ where: { branchId }, orderBy: { id: 'desc' }, select: { code: true } });
    const next = last?.code?.startsWith('CUST-') ? parseInt(last.code.replace('CUST-', ''), 10) + 1 : 1;
    const code = `CUST-${String(next).padStart(4, '0')}`;

    const ob = openingBalance ? Number(openingBalance) : 0;
    const cl = creditLimit ? Number(creditLimit) : 0;

    const customer = await prisma.customer.create({
      data: {
        code,
        name,
        phone,
        email: email || null,
        address: address || null,
        company: company || null,
        area: area || null,
        city: city || 'Dhaka',
        openingBalance: ob,
        currentBalance: ob,
        creditLimit: cl,
        branchId,
        isActive: true,
      },
    });

    res.status(201).json({ success: true, message: 'Customer created successfully', data: customer });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
};

// ==================== GET PRODUCTS FOR SALE ====================
exports.getProductsForSale = async (req, res) => {
  try {
    const { search = '', category } = req.query;
    const branchId = getBranchId(req);

    const where = { isActive: true, stockQuantity: { gt: 0 }, branchId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (category) where.category = category;

    const products = await prisma.product.findMany({
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
        taxRate: true,
        brand: true,
        model: true,
      },
      orderBy: { name: 'asc' },
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Get products for sale error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

// ==================== DASHBOARD: TODAY ====================
exports.getTodaySummary = async (req, res) => {
  try {
    const branchId = getBranchId(req);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const where = {
      branchId,
      invoiceDate: { gte: today, lt: tomorrow },
      status: 'completed',
    };

    const agg = await prisma.sale.aggregate({
      where,
      _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
      _count: { id: true },
    });

    res.status(200).json({
      success: true,
      data: {
        totalAmount: agg._sum.totalAmount || 0,
        paidAmount: agg._sum.paidAmount || 0,
        dueAmount: agg._sum.dueAmount || 0,
        count: agg._count.id || 0,
        date: today.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    console.error('Today sales error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch today sales' });
  }
};
