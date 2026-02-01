const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { formatDate } = require('../utils/dateUtils');
const { validateCustomerData } = require('../validations/customerValidation');

// ==================== GET CUSTOMERS ====================
exports.getCustomers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      type,
      area,
      city,
      active = true,
      hasDue = false,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const branchId = req.user?.branchId;

    // Build where condition
    const where = {
      branchId,
      isActive: active === 'true'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { code: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    if (area) {
      where.area = area;
    }

    if (city) {
      where.city = city;
    }

    if (hasDue === 'true') {
      where.currentBalance = { gt: 0 };
    } else if (hasDue === 'false') {
      where.currentBalance = { lte: 0 };
    }

    // Build orderBy
    const orderBy = {};
    if (sortBy === 'balance') {
      orderBy.currentBalance = sortOrder;
    } else if (sortBy === 'created') {
      orderBy.createdAt = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          code: true,
          name: true,
          type: true,
          company: true,
          phone: true,
          email: true,
          address: true,
          area: true,
          city: true,
          currentBalance: true,
          creditLimit: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              sales: {
                where: {
                  status: 'completed'
                }
              }
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.customer.count({ where })
    ]);

    // Calculate summary
    const summary = await prisma.customer.aggregate({
      where,
      _sum: {
        currentBalance: true,
        creditLimit: true
      },
      _avg: {
        currentBalance: true
      },
      _count: {
        id: true
      }
    });

    // Get areas and cities for filters
    const areas = await prisma.customer.findMany({
      where: { branchId, isActive: true },
      distinct: ['area'],
      select: { area: true }
    });

    const cities = await prisma.customer.findMany({
      where: { branchId, isActive: true },
      distinct: ['city'],
      select: { city: true }
    });

    // Format customers with additional data
    const formattedCustomers = customers.map(customer => ({
      ...customer,
      totalSales: customer._count.sales,
      creditUtilization: customer.creditLimit > 0 
        ? (customer.currentBalance / customer.creditLimit * 100).toFixed(2)
        : 0,
      isOverdue: customer.currentBalance > customer.creditLimit
    }));

    res.status(200).json({
      success: true,
      data: {
        customers: formattedCustomers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: {
          totalCustomers: summary._count.id || 0,
          totalBalance: summary._sum.currentBalance || 0,
          totalCreditLimit: summary._sum.creditLimit || 0,
          averageBalance: summary._avg.currentBalance || 0,
          customersWithDue: await prisma.customer.count({
            where: { ...where, currentBalance: { gt: 0 } }
          })
        },
        filters: {
          areas: areas.filter(a => a.area).map(a => a.area),
          cities: cities.filter(c => c.city).map(c => c.city),
          types: ['individual', 'company']
        }
      }
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customers'
    });
  }
};

// ==================== GET CUSTOMER BY ID ====================
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user?.branchId;

    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
        branchId
      },
      include: {
        sales: {
          where: {
            status: 'completed'
          },
          orderBy: {
            invoiceDate: 'desc'
          },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            invoiceDate: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true,
            status: true,
            paymentStatus: true
          }
        },
        payments: {
          where: {
            status: 'completed'
          },
          orderBy: {
            paymentDate: 'desc'
          },
          take: 10,
          select: {
            id: true,
            referenceNo: true,
            paymentDate: true,
            amount: true,
            paymentMethod: true,
            notes: true
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Calculate customer statistics
    const stats = await prisma.sale.aggregate({
      where: {
        customerId: parseInt(id),
        branchId,
        status: 'completed'
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        discount: true
      },
      _count: {
        id: true
      },
      _avg: {
        totalAmount: true
      }
    });

    // Calculate payment statistics
    const paymentStats = await prisma.payment.aggregate({
      where: {
        customerId: parseInt(id),
        branchId,
        status: 'completed'
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Get recent activity
    const recentActivity = await prisma.$queryRaw`
      SELECT 
        'sale' as type,
        id,
        invoice_number as reference,
        invoice_date as date,
        total_amount as amount,
        'Sale' as description
      FROM sales
      WHERE customer_id = ${parseInt(id)}
        AND branch_id = ${branchId}
        AND status = 'completed'
      
      UNION ALL
      
      SELECT 
        'payment' as type,
        id,
        reference_no as reference,
        payment_date as date,
        amount,
        CONCAT('Payment - ', payment_method) as description
      FROM payments
      WHERE customer_id = ${parseInt(id)}
        AND branch_id = ${branchId}
        AND status = 'completed'
      
      ORDER BY date DESC
      LIMIT 20
    `;

    // Calculate credit utilization
    const creditUtilization = customer.creditLimit > 0 
      ? (customer.currentBalance / customer.creditLimit * 100).toFixed(2)
      : 0;

    // Calculate average payment period (in days)
    const paymentPeriods = await prisma.$queryRaw`
      SELECT 
        AVG(DATEDIFF(p.payment_date, s.invoice_date)) as avg_payment_days
      FROM sales s
      JOIN payments p ON s.id = p.sale_id
      WHERE s.customer_id = ${parseInt(id)}
        AND s.branch_id = ${branchId}
        AND s.status = 'completed'
        AND p.status = 'completed'
        AND s.due_amount = 0
    `;

    const avgPaymentDays = paymentPeriods[0]?.avg_payment_days || 0;

    res.status(200).json({
      success: true,
      data: {
        customer,
        statistics: {
          totalSales: stats._sum.totalAmount || 0,
          totalPaid: stats._sum.paidAmount || 0,
          totalDue: stats._sum.dueAmount || 0,
          totalDiscount: stats._sum.discount || 0,
          salesCount: stats._count.id || 0,
          averageSaleValue: stats._avg.totalAmount || 0,
          totalPayments: paymentStats._sum.amount || 0,
          paymentCount: paymentStats._count.id || 0,
          creditUtilization: parseFloat(creditUtilization),
          avgPaymentDays: Math.round(avgPaymentDays),
          isOverLimit: customer.currentBalance > customer.creditLimit
        },
        recentSales: customer.sales,
        recentPayments: customer.payments,
        recentActivity,
        summary: {
          currentBalance: customer.currentBalance,
          creditAvailable: Math.max(0, customer.creditLimit - customer.currentBalance),
          paymentPerformance: avgPaymentDays < 30 ? 'Good' : avgPaymentDays < 60 ? 'Average' : 'Poor'
        }
      }
    });

  } catch (error) {
    console.error('Get customer by id error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer details'
    });
  }
};

// ==================== CREATE CUSTOMER ====================
exports.createCustomer = async (req, res) => {
  try {
    const {
      name,
      type = 'individual',
      company,
      phone,
      email,
      address,
      area,
      city = 'Dhaka',
      openingBalance = 0,
      creditLimit = 0,
      paymentTerms,
      taxNumber,
      notes,
      isActive = true
    } = req.body;

    const branchId = req.user?.branchId || 1;
    const userId = req.user?.id;

    // Validate customer data
    const validation = validateCustomerData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      });
    }

    // Check if phone already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone,
        branchId
      }
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: 'Customer with this phone number already exists'
      });
    }

    // Generate customer code
    const lastCustomer = await prisma.customer.findFirst({
      where: { branchId },
      orderBy: { id: 'desc' }
    });

    const nextNumber = lastCustomer ? parseInt(lastCustomer.code.replace('CUST-', '')) + 1 : 1;
    const code = `CUST-${nextNumber.toString().padStart(4, '0')}`;

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        code,
        name,
        type,
        company,
        phone,
        email,
        address,
        area,
        city,
        openingBalance,
        currentBalance: openingBalance,
        creditLimit,
        paymentTerms,
        taxNumber,
        notes,
        isActive,
        branchId,
        createdById: userId
      }
    });

    // Create opening balance journal entry if opening balance != 0
    if (openingBalance !== 0) {
      await prisma.journalEntry.create({
        data: {
          entryDate: new Date(),
          voucherNo: `OB-${code}`,
          voucherType: 'opening',
          reference: `Opening balance for ${name}`,
          branchId,
          createdById: userId,
          items: {
            create: [
              {
                accountId: 120, // Accounts Receivable
                debit: openingBalance > 0 ? openingBalance : 0,
                credit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                narration: `Opening balance for ${name}`
              },
              {
                accountId: 310, // Capital Account
                debit: openingBalance < 0 ? Math.abs(openingBalance) : 0,
                credit: openingBalance > 0 ? openingBalance : 0,
                narration: `Opening balance adjustment`
              }
            ]
          }
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create customer'
    });
  }
};

// ==================== UPDATE CUSTOMER ====================
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      company,
      phone,
      email,
      address,
      area,
      city,
      creditLimit,
      paymentTerms,
      taxNumber,
      notes,
      isActive
    } = req.body;

    const branchId = req.user?.branchId;
    const userId = req.user?.id;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
        branchId
      }
    });

    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Check if phone is being changed and if it already exists
    if (phone && phone !== existingCustomer.phone) {
      const phoneExists = await prisma.customer.findFirst({
        where: {
          phone,
          branchId,
          id: { not: parseInt(id) }
        }
      });

      if (phoneExists) {
        return res.status(400).json({
          success: false,
          error: 'Another customer with this phone number already exists'
        });
      }
    }

    // Update customer
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (area !== undefined) updateData.area = area;
    if (city !== undefined) updateData.city = city;
    if (creditLimit !== undefined) updateData.creditLimit = creditLimit;
    if (paymentTerms !== undefined) updateData.paymentTerms = paymentTerms;
    if (taxNumber !== undefined) updateData.taxNumber = taxNumber;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    updateData.updatedAt = new Date();
    updateData.updatedById = userId;

    const updatedCustomer = await prisma.customer.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update customer'
    });
  }
};

// ==================== DELETE CUSTOMER ====================
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user?.branchId;

    // Check if customer exists
    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(id),
        branchId
      },
      include: {
        sales: {
          where: {
            status: { not: 'cancelled' }
          }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Check if customer has active sales
    if (customer.sales.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with active sales. Consider deactivating instead.'
      });
    }

    // Check if customer has balance
    if (customer.currentBalance !== 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete customer with outstanding balance'
      });
    }

    // Soft delete (deactivate) customer
    await prisma.customer.update({
      where: { id: parseInt(id) },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete customer'
    });
  }
};

// ==================== GET CUSTOMER LEDGER ====================
exports.getCustomerLedger = async (req, res) => {
  try {
    const { customerId } = req.params;
    const {
      startDate,
      endDate,
      page = 1,
      limit = 50,
      detailed = false
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const branchId = req.user?.branchId;

    // Get customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: parseInt(customerId),
        branchId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.dateField = {
        gte: new Date(startDate),
        lte: new Date(`${endDate}T23:59:59.999Z`)
      };
    }

    // Get sales
    const sales = await prisma.sale.findMany({
      where: {
        customerId: parseInt(customerId),
        branchId,
        status: 'completed',
        ...(startDate && endDate && {
          invoiceDate: {
            gte: new Date(startDate),
            lte: new Date(`${endDate}T23:59:59.999Z`)
          }
        })
      },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        status: true,
        items: {
          select: {
            productName: true,
            quantity: true
          },
          take: 1
        }
      },
      orderBy: {
        invoiceDate: 'desc'
      },
      skip: detailed ? 0 : skip,
      take: detailed ? 100 : parseInt(limit)
    });

    // Get payments
    const payments = await prisma.payment.findMany({
      where: {
        customerId: parseInt(customerId),
        branchId,
        status: 'completed',
        ...(startDate && endDate && {
          paymentDate: {
            gte: new Date(startDate),
            lte: new Date(`${endDate}T23:59:59.999Z`)
          }
        })
      },
      select: {
        id: true,
        referenceNo: true,
        paymentDate: true,
        amount: true,
        paymentMethod: true,
        notes: true,
        sale: {
          select: {
            invoiceNumber: true
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      },
      skip: detailed ? 0 : skip,
      take: detailed ? 100 : parseInt(limit)
    });

    // Combine and sort ledger entries
    const ledgerEntries = [
      ...sales.map(sale => ({
        date: sale.invoiceDate,
        type: 'sale',
        reference: sale.invoiceNumber,
        debit: sale.totalAmount,
        credit: 0,
        balance: 0, // Will calculate
        details: `Sale - ${sale.items[0]?.productName || 'Multiple items'}`,
        relatedId: sale.id,
        dueAmount: sale.dueAmount,
        status: sale.status
      })),
      ...payments.map(payment => ({
        date: payment.paymentDate,
        type: 'payment',
        reference: payment.referenceNo,
        debit: 0,
        credit: payment.amount,
        balance: 0,
        details: `Payment - ${payment.paymentMethod}${payment.sale ? ` for ${payment.sale.invoiceNumber}` : ''}`,
        relatedId: payment.id,
        notes: payment.notes
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate running balance
    let runningBalance = customer.openingBalance;
    const ledgerWithBalance = ledgerEntries.map(entry => {
      runningBalance += entry.debit - entry.credit;
      return {
        ...entry,
        balance: runningBalance
      };
    });

    // Get opening balance entry
    const openingEntry = {
      date: startDate ? new Date(startDate) : customer.createdAt,
      type: 'opening',
      reference: 'Opening Balance',
      debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
      credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
      balance: customer.openingBalance,
      details: 'Opening Balance',
      relatedId: null
    };

    // Add opening balance at the beginning
    ledgerWithBalance.unshift(openingEntry);

    // Calculate summary
    const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const currentBalance = customer.currentBalance;
    const outstandingInvoices = sales.filter(s => s.dueAmount > 0).length;

    // Calculate aging analysis if detailed
    let agingAnalysis = null;
    if (detailed) {
      const now = new Date();
      agingAnalysis = sales
        .filter(sale => sale.dueAmount > 0)
        .reduce((aging, sale) => {
          const daysOld = Math.floor((now - sale.invoiceDate) / (1000 * 60 * 60 * 24));
          
          if (daysOld <= 30) {
            aging.current += sale.dueAmount;
          } else if (daysOld <= 60) {
            aging.oneToSixty += sale.dueAmount;
          } else if (daysOld <= 90) {
            aging.sixtyToNinety += sale.dueAmount;
          } else {
            aging.overNinety += sale.dueAmount;
          }
          
          aging.total += sale.dueAmount;
          return aging;
        }, { current: 0, oneToSixty: 0, sixtyToNinety: 0, overNinety: 0, total: 0 });
    }

    res.status(200).json({
      success: true,
      data: {
        customer,
        ledger: ledgerWithBalance,
        summary: {
          openingBalance: customer.openingBalance,
          totalSales,
          totalPayments,
          currentBalance,
          netChange: totalSales - totalPayments,
          outstandingInvoices,
          creditAvailable: Math.max(0, customer.creditLimit - currentBalance)
        },
        agingAnalysis,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: sales.length + payments.length
        }
      }
    });

  } catch (error) {
    console.error('Get customer ledger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer ledger'
    });
  }
};

// ==================== UPDATE CUSTOMER BALANCE ====================
exports.updateCustomerBalance = async (req, res) => {
  const transaction = await prisma.$transaction(async (prisma) => {
    try {
      const { customerId } = req.params;
      const userId = req.user?.id;
      const branchId = req.user?.branchId;
      
      const {
        amount,
        type, // 'add' or 'subtract'
        notes,
        reference,
        paymentMethod = 'cash',
        paymentDate = new Date()
      } = req.body;

      // Get customer
      const customer = await prisma.customer.findFirst({
        where: {
          id: parseInt(customerId),
          branchId
        }
      });

      if (!customer) {
        throw new Error('Customer not found');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Calculate new balance
      const adjustmentAmount = type === 'add' ? amount : -amount;
      const newBalance = customer.currentBalance + adjustmentAmount;

      // Check credit limit
      if (newBalance > customer.creditLimit && customer.creditLimit > 0) {
        throw new Error(`Adjustment would exceed credit limit. Current: ${customer.currentBalance}, Limit: ${customer.creditLimit}, New: ${newBalance}`);
      }

      // Generate reference number
      const refNo = reference || `ADJ-${customer.code}-${Date.now().toString().slice(-6)}`;

      // Create adjustment journal entry
      const journalEntry = await prisma.journalEntry.create({
        data: {
          entryDate: new Date(paymentDate),
          voucherNo: refNo,
          voucherType: 'adjustment',
          reference: `Balance adjustment for ${customer.name}`,
          notes,
          branchId,
          createdById: userId,
          items: {
            create: [
              {
                accountId: 120, // Accounts Receivable
                debit: type === 'add' ? amount : 0,
                credit: type === 'subtract' ? amount : 0,
                narration: `Balance adjustment for ${customer.name}: ${notes || 'Manual adjustment'}`
              },
              {
                accountId: getAdjustmentAccountId(type),
                debit: type === 'subtract' ? amount : 0,
                credit: type === 'add' ? amount : 0,
                narration: `Customer balance adjustment`
              }
            ]
          }
        }
      });

      // Update customer balance
      const updatedCustomer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          currentBalance: newBalance,
          updatedAt: new Date(),
          updatedById: userId
        }
      });

      // Create payment record for tracking
      if (type === 'subtract') {
        await prisma.payment.create({
          data: {
            paymentDate: new Date(paymentDate),
            referenceNo: refNo,
            customerId: customer.id,
            amount,
            paymentMethod,
            notes: `Manual adjustment: ${notes || 'Balance adjustment'}`,
            status: 'completed',
            branchId,
            createdById: userId
          }
        });
      }

      return {
        success: true,
        data: {
          customer: updatedCustomer,
          journalEntry,
          adjustment: {
            type,
            amount,
            previousBalance: customer.currentBalance,
            newBalance,
            reference: refNo
          }
        },
        message: `Customer balance ${type === 'add' ? 'increased' : 'decreased'} successfully`
      };

    } catch (error) {
      console.error('Update customer balance error:', error);
      throw error;
    }
  });

  try {
    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update customer balance',
      details: error.message
    });
  }
};

// ==================== GET CUSTOMER DUE LIST ====================
exports.getCustomerDueList = async (req, res) => {
  try {
    const {
      minAmount = 0,
      maxAmount,
      overdueOnly = false,
      sortBy = 'balance',
      sortOrder = 'desc'
    } = req.query;

    const branchId = req.user?.branchId;

    // Build where condition
    const where = {
      branchId,
      isActive: true,
      currentBalance: { gt: parseFloat(minAmount) }
    };

    if (maxAmount) {
      where.currentBalance.lte = parseFloat(maxAmount);
    }

    if (overdueOnly === 'true') {
      where.currentBalance = {
        gt: prisma.customer.fields.creditLimit
      };
    }

    // Build orderBy
    const orderBy = {};
    if (sortBy === 'creditLimit') {
      orderBy.creditLimit = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.currentBalance = sortOrder;
    }

    // Get customers with due
    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        code: true,
        name: true,
        company: true,
        phone: true,
        currentBalance: true,
        creditLimit: true,
        updatedAt: true,
        sales: {
          where: {
            status: 'completed',
            dueAmount: { gt: 0 }
          },
          select: {
            invoiceNumber: true,
            invoiceDate: true,
            dueAmount: true
          },
          orderBy: {
            invoiceDate: 'asc'
          },
          take: 5
        }
      },
      orderBy
    });

    // Calculate totals
    const totals = customers.reduce((acc, customer) => {
      acc.totalDue += customer.currentBalance;
      acc.totalCustomers += 1;
      acc.overLimit += customer.currentBalance > customer.creditLimit ? 1 : 0;
      return acc;
    }, { totalDue: 0, totalCustomers: 0, overLimit: 0 });

    // Calculate aging for each customer
    const customersWithAging = await Promise.all(
      customers.map(async (customer) => {
        const aging = await calculateCustomerAging(customer.id, branchId);
        
        return {
          ...customer,
          aging,
          creditUtilization: customer.creditLimit > 0 
            ? (customer.currentBalance / customer.creditLimit * 100).toFixed(2)
            : 'N/A',
          isOverLimit: customer.currentBalance > customer.creditLimit,
          oldestInvoice: customer.sales.length > 0 ? customer.sales[0] : null
        };
      })
    );

    // Group by aging category
    const agingSummary = customersWithAging.reduce((summary, customer) => {
      if (customer.aging.overNinety > 0) summary.overNinety += 1;
      else if (customer.aging.sixtyToNinety > 0) summary.sixtyToNinety += 1;
      else if (customer.aging.oneToSixty > 0) summary.oneToSixty += 1;
      else summary.current += 1;
      return summary;
    }, { current: 0, oneToSixty: 0, sixtyToNinety: 0, overNinety: 0 });

    res.status(200).json({
      success: true,
      data: {
        customers: customersWithAging,
        totals,
        agingSummary,
        summary: {
          totalDueAmount: totals.totalDue,
          averageDuePerCustomer: totals.totalCustomers > 0 ? totals.totalDue / totals.totalCustomers : 0,
          customersOverLimit: totals.overLimit,
          percentageOverLimit: totals.totalCustomers > 0 ? (totals.overLimit / totals.totalCustomers * 100).toFixed(2) : 0
        }
      }
    });

  } catch (error) {
    console.error('Get customer due list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch customer due list'
    });
  }
};

// ==================== GET CUSTOMER REPORT ====================
exports.getCustomerReport = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'customer', // customer, area, city, type
      includeInactive = false
    } = req.query;

    const branchId = req.user?.branchId;

    // Build date filter for sales
    const saleDateFilter = {};
    if (startDate && endDate) {
      saleDateFilter.invoiceDate = {
        gte: new Date(startDate),
        lte: new Date(`${endDate}T23:59:59.999Z`)
      };
    }

    let reportData = [];

    switch (groupBy) {
      case 'customer':
        // Group by individual customer
        const customerReport = await prisma.$queryRaw`
          SELECT 
            c.id,
            c.code,
            c.name,
            c.type,
            c.company,
            c.area,
            c.city,
            c.current_balance as current_balance,
            c.credit_limit as credit_limit,
            COUNT(s.id) as total_invoices,
            SUM(s.total_amount) as total_sales,
            SUM(s.paid_amount) as total_paid,
            SUM(s.due_amount) as total_due,
            SUM(s.discount) as total_discount,
            AVG(s.total_amount) as avg_invoice_value,
            MAX(s.invoice_date) as last_sale_date
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
            AND s.status = 'completed'
            ${startDate ? Prisma.sql`AND s.invoice_date >= ${new Date(startDate)}` : Prisma.sql``}
            ${endDate ? Prisma.sql`AND s.invoice_date <= ${new Date(`${endDate}T23:59:59.999Z`)}` : Prisma.sql``}
          WHERE c.branch_id = ${branchId || 1}
            AND c.is_active = ${!includeInactive}
          GROUP BY c.id, c.code, c.name, c.type, c.company, c.area, c.city, c.current_balance, c.credit_limit
          ORDER BY total_sales DESC
        `;
        reportData = customerReport;
        break;

      case 'area':
        // Group by area
        const areaReport = await prisma.$queryRaw`
          SELECT 
            c.area,
            COUNT(DISTINCT c.id) as customer_count,
            SUM(s.total_amount) as total_sales,
            SUM(s.paid_amount) as total_paid,
            SUM(s.due_amount) as total_due,
            AVG(s.total_amount) as avg_sale_per_customer,
            COUNT(s.id) as total_invoices
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
            AND s.status = 'completed'
            ${startDate ? Prisma.sql`AND s.invoice_date >= ${new Date(startDate)}` : Prisma.sql``}
            ${endDate ? Prisma.sql`AND s.invoice_date <= ${new Date(`${endDate}T23:59:59.999Z`)}` : Prisma.sql``}
          WHERE c.branch_id = ${branchId || 1}
            AND c.is_active = ${!includeInactive}
            AND c.area IS NOT NULL
          GROUP BY c.area
          ORDER BY total_sales DESC
        `;
        reportData = areaReport;
        break;

      case 'city':
        // Group by city
        const cityReport = await prisma.$queryRaw`
          SELECT 
            c.city,
            COUNT(DISTINCT c.id) as customer_count,
            SUM(s.total_amount) as total_sales,
            SUM(s.paid_amount) as total_paid,
            SUM(s.due_amount) as total_due,
            AVG(s.total_amount) as avg_sale_per_customer,
            COUNT(s.id) as total_invoices
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
            AND s.status = 'completed'
            ${startDate ? Prisma.sql`AND s.invoice_date >= ${new Date(startDate)}` : Prisma.sql``}
            ${endDate ? Prisma.sql`AND s.invoice_date <= ${new Date(`${endDate}T23:59:59.999Z`)}` : Prisma.sql``}
          WHERE c.branch_id = ${branchId || 1}
            AND c.is_active = ${!includeInactive}
            AND c.city IS NOT NULL
          GROUP BY c.city
          ORDER BY total_sales DESC
        `;
        reportData = cityReport;
        break;

      case 'type':
        // Group by customer type
        const typeReport = await prisma.$queryRaw`
          SELECT 
            c.type,
            COUNT(DISTINCT c.id) as customer_count,
            SUM(s.total_amount) as total_sales,
            SUM(s.paid_amount) as total_paid,
            SUM(s.due_amount) as total_due,
            AVG(s.total_amount) as avg_sale_per_customer,
            COUNT(s.id) as total_invoices,
            AVG(c.credit_limit) as avg_credit_limit
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
            AND s.status = 'completed'
            ${startDate ? Prisma.sql`AND s.invoice_date >= ${new Date(startDate)}` : Prisma.sql``}
            ${endDate ? Prisma.sql`AND s.invoice_date <= ${new Date(`${endDate}T23:59:59.999Z`)}` : Prisma.sql``}
          WHERE c.branch_id = ${branchId || 1}
            AND c.is_active = ${!includeInactive}
          GROUP BY c.type
          ORDER BY total_sales DESC
        `;
        reportData = typeReport;
        break;

      default:
        reportData = [];
    }

    // Calculate overall summary
    const summary = await prisma.customer.aggregate({
      where: {
        branchId,
        isActive: !includeInactive
      },
      _sum: {
        currentBalance: true,
        creditLimit: true
      },
      _count: {
        id: true
      }
    });

    const salesSummary = await prisma.sale.aggregate({
      where: {
        branchId,
        status: 'completed',
        ...saleDateFilter
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        report: reportData,
        summary: {
          totalCustomers: summary._count.id || 0,
          totalBalance: summary._sum.currentBalance || 0,
          totalCreditLimit: summary._sum.creditLimit || 0,
          totalSales: salesSummary._sum.totalAmount || 0,
          totalPaid: salesSummary._sum.paidAmount || 0,
          totalDue: salesSummary._sum.dueAmount || 0
        },
        parameters: {
          startDate,
          endDate,
          groupBy,
          includeInactive
        }
      }
    });

  } catch (error) {
    console.error('Get customer report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customer report'
    });
  }
};

// ==================== EXPORT CUSTOMERS ====================
exports.exportCustomers = async (req, res) => {
  try {
    const { format = 'csv', includeInactive = false } = req.query;
    const branchId = req.user?.branchId;

    // Get customers
    const customers = await prisma.customer.findMany({
      where: {
        branchId,
        isActive: includeInactive === 'true' ? undefined : true
      },
      select: {
        code: true,
        name: true,
        type: true,
        company: true,
        phone: true,
        email: true,
        address: true,
        area: true,
        city: true,
        currentBalance: true,
        creditLimit: true,
        paymentTerms: true,
        taxNumber: true,
        isActive: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    if (format === 'csv') {
      // Convert to CSV
      const csvData = customers.map(customer => ({
        'Code': customer.code,
        'Name': customer.name,
        'Type': customer.type,
        'Company': customer.company || '',
        'Phone': customer.phone,
        'Email': customer.email || '',
        'Address': customer.address || '',
        'Area': customer.area || '',
        'City': customer.city,
        'Current Balance': customer.currentBalance,
        'Credit Limit': customer.creditLimit,
        'Payment Terms': customer.paymentTerms || '',
        'Tax Number': customer.taxNumber || '',
        'Status': customer.isActive ? 'Active' : 'Inactive',
        'Created Date': customer.createdAt.toISOString().split('T')[0]
      }));

      // Convert to CSV string
      const csvString = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=customers-export-${Date.now()}.csv`);
      res.send(csvString);
    } else {
      res.status(200).json({
        success: true,
        data: customers
      });
    }

  } catch (error) {
    console.error('Export customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export customers'
    });
  }
};

// ==================== BULK CUSTOMER ACTIONS ====================
exports.bulkUpdateCustomers = async (req, res) => {
  try {
    const { customerIds, action, data } = req.body;
    const branchId = req.user?.branchId;
    const userId = req.user?.id;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No customer IDs provided'
      });
    }

    let result;
    let message = '';

    switch (action) {
      case 'activate':
        result = await prisma.customer.updateMany({
          where: {
            id: { in: customerIds.map(id => parseInt(id)) },
            branchId
          },
          data: {
            isActive: true,
            updatedAt: new Date(),
            updatedById: userId
          }
        });
        message = `${result.count} customers activated successfully`;
        break;

      case 'deactivate':
        result = await prisma.customer.updateMany({
          where: {
            id: { in: customerIds.map(id => parseInt(id)) },
            branchId,
            currentBalance: 0
          },
          data: {
            isActive: false,
            updatedAt: new Date(),
            updatedById: userId
          }
        });
        message = `${result.count} customers deactivated successfully`;
        break;

      case 'updateArea':
        if (!data.area) {
          return res.status(400).json({
            success: false,
            error: 'Area data is required'
          });
        }
        result = await prisma.customer.updateMany({
          where: {
            id: { in: customerIds.map(id => parseInt(id)) },
            branchId
          },
          data: {
            area: data.area,
            updatedAt: new Date(),
            updatedById: userId
          }
        });
        message = `${result.count} customers area updated successfully`;
        break;

      case 'updateCreditLimit':
        if (!data.creditLimit || data.creditLimit < 0) {
          return res.status(400).json({
            success: false,
            error: 'Valid credit limit is required'
          });
        }
        result = await prisma.customer.updateMany({
          where: {
            id: { in: customerIds.map(id => parseInt(id)) },
            branchId
          },
          data: {
            creditLimit: parseFloat(data.creditLimit),
            updatedAt: new Date(),
            updatedById: userId
          }
        });
        message = `${result.count} customers credit limit updated successfully`;
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action specified'
        });
    }

    res.status(200).json({
      success: true,
      message,
      data: {
        count: result.count,
        customerIds
      }
    });

  } catch (error) {
    console.error('Bulk update customers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk update'
    });
  }
};

// ==================== HELPER FUNCTIONS ====================
async function calculateCustomerAging(customerId, branchId) {
  const now = new Date();
  
  const sales = await prisma.sale.findMany({
    where: {
      customerId,
      branchId,
      status: 'completed',
      dueAmount: { gt: 0 }
    },
    select: {
      invoiceDate: true,
      dueAmount: true
    }
  });

  const aging = sales.reduce((acc, sale) => {
    const daysOld = Math.floor((now - sale.invoiceDate) / (1000 * 60 * 60 * 24));
    
    if (daysOld <= 30) {
      acc.current += sale.dueAmount;
    } else if (daysOld <= 60) {
      acc.oneToSixty += sale.dueAmount;
    } else if (daysOld <= 90) {
      acc.sixtyToNinety += sale.dueAmount;
    } else {
      acc.overNinety += sale.dueAmount;
    }
    
    acc.total += sale.dueAmount;
    return acc;
  }, { current: 0, oneToSixty: 0, sixtyToNinety: 0, overNinety: 0, total: 0 });

  return aging;
}

function getAdjustmentAccountId(type) {
  // Return appropriate account ID based on adjustment type
  if (type === 'add') {
    return 310; // Capital Account (for adding to receivable)
  } else {
    return 110; // Cash Account (for receiving payment)
  }
}

module.exports = exports;