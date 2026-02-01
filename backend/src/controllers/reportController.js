const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ==================== SALES REPORTS ====================
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, customerId, productId, paymentStatus, groupBy } = req.query;
    const branchId = req.user?.branchId;

    const where = { status: 'completed' };
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate && endDate) {
      where.invoiceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (customerId) {
      where.customerId = parseInt(customerId);
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Get sales with items
    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            company: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        invoiceDate: 'desc'
      }
    });

    // Process based on grouping
    let reportData = [];
    let summary = {
      totalSales: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      totalProfit: 0,
      totalItems: 0
    };

    if (groupBy === 'customer') {
      // Group by customer
      const customerMap = {};
      
      sales.forEach(sale => {
        const customerKey = sale.customerId;
        if (!customerMap[customerKey]) {
          customerMap[customerKey] = {
            customer: sale.customer,
            salesCount: 0,
            totalAmount: 0,
            totalPaid: 0,
            totalDue: 0,
            totalProfit: 0,
            sales: []
          };
        }
        
        const saleProfit = sale.items.reduce((sum, item) => sum + parseFloat(item.profit || 0), 0);
        
        customerMap[customerKey].salesCount += 1;
        customerMap[customerKey].totalAmount += parseFloat(sale.totalAmount);
        customerMap[customerKey].totalPaid += parseFloat(sale.paidAmount);
        customerMap[customerKey].totalDue += parseFloat(sale.dueAmount);
        customerMap[customerKey].totalProfit += saleProfit;
        customerMap[customerKey].sales.push({
          invoiceNo: sale.invoiceNumber,
          date: sale.invoiceDate,
          amount: sale.totalAmount,
          paid: sale.paidAmount,
          due: sale.dueAmount,
          profit: saleProfit
        });
      });

      reportData = Object.values(customerMap);
      
      // Calculate summary
      reportData.forEach(customerData => {
        summary.totalSales += customerData.salesCount;
        summary.totalAmount += customerData.totalAmount;
        summary.totalPaid += customerData.totalPaid;
        summary.totalDue += customerData.totalDue;
        summary.totalProfit += customerData.totalProfit;
      });

    } else if (groupBy === 'product') {
      // Group by product
      const productMap = {};
      
      sales.forEach(sale => {
        sale.items.forEach(item => {
          const productKey = item.productId;
          if (!productMap[productKey]) {
            productMap[productKey] = {
              product: item.product,
              salesCount: 0,
              totalQuantity: 0,
              totalAmount: 0,
              totalProfit: 0,
              averagePrice: 0
            };
          }
          
          productMap[productKey].salesCount += 1;
          productMap[productKey].totalQuantity += parseFloat(item.quantity);
          productMap[productKey].totalAmount += parseFloat(item.totalPrice);
          productMap[productKey].totalProfit += parseFloat(item.profit || 0);
        });
      });

      // Calculate averages
      Object.keys(productMap).forEach(key => {
        const product = productMap[key];
        product.averagePrice = product.totalAmount / product.totalQuantity;
      });

      reportData = Object.values(productMap);
      
      // Calculate summary
      reportData.forEach(productData => {
        summary.totalSales += productData.salesCount;
        summary.totalAmount += productData.totalAmount;
        summary.totalProfit += productData.totalProfit;
        summary.totalItems += productData.totalQuantity;
      });

    } else if (groupBy === 'daily') {
      // Group by date
      const dateMap = {};
      
      sales.forEach(sale => {
        const dateKey = sale.invoiceDate.toISOString().split('T')[0];
        if (!dateMap[dateKey]) {
          dateMap[dateKey] = {
            date: dateKey,
            salesCount: 0,
            totalAmount: 0,
            totalPaid: 0,
            totalDue: 0,
            totalProfit: 0,
            customerCount: new Set()
          };
        }
        
        const saleProfit = sale.items.reduce((sum, item) => sum + parseFloat(item.profit || 0), 0);
        
        dateMap[dateKey].salesCount += 1;
        dateMap[dateKey].totalAmount += parseFloat(sale.totalAmount);
        dateMap[dateKey].totalPaid += parseFloat(sale.paidAmount);
        dateMap[dateKey].totalDue += parseFloat(sale.dueAmount);
        dateMap[dateKey].totalProfit += saleProfit;
        dateMap[dateKey].customerCount.add(sale.customerId);
      });

      // Convert Set to count
      Object.keys(dateMap).forEach(key => {
        dateMap[key].customerCount = dateMap[key].customerCount.size;
      });

      reportData = Object.values(dateMap).sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // Calculate summary
      reportData.forEach(dateData => {
        summary.totalSales += dateData.salesCount;
        summary.totalAmount += dateData.totalAmount;
        summary.totalPaid += dateData.totalPaid;
        summary.totalDue += dateData.totalDue;
        summary.totalProfit += dateData.totalProfit;
      });

    } else {
      // No grouping - detailed report
      reportData = sales.map(sale => {
        const saleProfit = sale.items.reduce((sum, item) => sum + parseFloat(item.profit || 0), 0);
        
        summary.totalSales += 1;
        summary.totalAmount += parseFloat(sale.totalAmount);
        summary.totalPaid += parseFloat(sale.paidAmount);
        summary.totalDue += parseFloat(sale.dueAmount);
        summary.totalProfit += saleProfit;
        summary.totalItems += sale.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0);

        return {
          invoiceNo: sale.invoiceNumber,
          date: sale.invoiceDate,
          customer: sale.customer,
          items: sale.items.length,
          totalAmount: sale.totalAmount,
          paidAmount: sale.paidAmount,
          dueAmount: sale.dueAmount,
          paymentStatus: sale.paymentStatus,
          profit: saleProfit,
          items: sale.items.map(item => ({
            product: item.product,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            profit: item.profit
          }))
        };
      });
    }

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        groupBy: groupBy || 'none',
        summary,
        report: reportData,
        filters: {
          startDate,
          endDate,
          customerId,
          productId,
          paymentStatus
        }
      }
    });

  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate sales report'
    });
  }
};

// ==================== PURCHASE REPORTS ====================
exports.getPurchaseReport = async (req, res) => {
  try {
    const { startDate, endDate, supplierId, productId, status, groupBy } = req.query;
    const branchId = req.user?.branchId;

    const where = {};
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate && endDate) {
      where.purchaseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (supplierId) {
      where.supplierId = parseInt(supplierId);
    }

    if (status) {
      where.status = status;
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            company: true,
            phone: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        payments: true
      },
      orderBy: {
        purchaseDate: 'desc'
      }
    });

    // Similar grouping logic as sales report
    // ... (implementation similar to sales report)

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {},
        report: [],
        filters: {
          startDate,
          endDate,
          supplierId,
          productId,
          status
        }
      }
    });

  } catch (error) {
    console.error('Get purchase report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate purchase report'
    });
  }
};

// ==================== CUSTOMER LEDGER ====================
exports.getCustomerLedger = async (req, res) => {
  try {
    const { customerId, startDate, endDate } = req.query;
    const branchId = req.user?.branchId;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'Customer ID is required'
      });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) },
      select: {
        id: true,
        code: true,
        name: true,
        company: true,
        phone: true,
        openingBalance: true,
        currentBalance: true,
        creditLimit: true
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }

    // Get sales for this customer
    const where = { customerId: parseInt(customerId) };
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate && endDate) {
      where.invoiceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const sales = await prisma.sale.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        paymentStatus: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true
          }
        }
      },
      orderBy: {
        invoiceDate: 'asc'
      }
    });

    // Get payments for this customer
    const payments = await prisma.payment.findMany({
      where: {
        customerId: parseInt(customerId),
        status: 'completed'
      },
      select: {
        id: true,
        paymentDate: true,
        referenceNo: true,
        amount: true,
        paymentMethod: true,
        notes: true
      },
      orderBy: {
        paymentDate: 'asc'
      }
    });

    // Combine sales and payments into ledger
    const ledger = [];
    let runningBalance = parseFloat(customer.openingBalance) || 0;
    
    // Add opening balance entry
    ledger.push({
      date: startDate || customer.createdAt,
      type: 'Opening',
      reference: 'Opening Balance',
      debit: runningBalance > 0 ? runningBalance : 0,
      credit: runningBalance < 0 ? Math.abs(runningBalance) : 0,
      balance: runningBalance,
      details: 'Opening Balance'
    });

    // Process sales
    sales.forEach(sale => {
      ledger.push({
        date: sale.invoiceDate,
        type: 'Sale',
        reference: sale.invoiceNumber,
        debit: parseFloat(sale.totalAmount),
        credit: 0,
        balance: runningBalance + parseFloat(sale.totalAmount),
        details: `Sale - ${sale.items.length} items`
      });
      runningBalance += parseFloat(sale.totalAmount);
    });

    // Process payments
    payments.forEach(payment => {
      ledger.push({
        date: payment.paymentDate,
        type: 'Payment',
        reference: payment.referenceNo,
        debit: 0,
        credit: parseFloat(payment.amount),
        balance: runningBalance - parseFloat(payment.amount),
        details: `Payment - ${payment.paymentMethod}${payment.notes ? ` - ${payment.notes}` : ''}`
      });
      runningBalance -= parseFloat(payment.amount);
    });

    // Calculate totals
    const totals = {
      totalDebit: ledger.reduce((sum, entry) => sum + parseFloat(entry.debit || 0), 0),
      totalCredit: ledger.reduce((sum, entry) => sum + parseFloat(entry.credit || 0), 0),
      closingBalance: runningBalance
    };

    res.status(200).json({
      success: true,
      data: {
        customer,
        period: { startDate, endDate },
        ledger,
        totals,
        openingBalance: parseFloat(customer.openingBalance) || 0,
        currentBalance: parseFloat(customer.currentBalance) || 0
      }
    });

  } catch (error) {
    console.error('Get customer ledger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate customer ledger'
    });
  }
};

// ==================== SUPPLIER LEDGER ====================
exports.getSupplierLedger = async (req, res) => {
  try {
    const { supplierId, startDate, endDate } = req.query;
    const branchId = req.user?.branchId;

    if (!supplierId) {
      return res.status(400).json({
        success: false,
        error: 'Supplier ID is required'
      });
    }

    // Similar implementation to customer ledger
    // ... (implementation similar to customer ledger)

    res.status(200).json({
      success: true,
      data: {
        // ... ledger data
      }
    });

  } catch (error) {
    console.error('Get supplier ledger error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate supplier ledger'
    });
  }
};

// ==================== PRODUCT PERFORMANCE REPORT ====================
exports.getProductPerformance = async (req, res) => {
  try {
    const { startDate, endDate, category, topN = 10 } = req.query;
    const branchId = req.user?.branchId;

    const where = { status: 'completed' };
    
    if (branchId) {
      where.branchId = branchId;
    }

    if (startDate && endDate) {
      where.invoiceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get sales with items
    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                category: true,
                costPrice: true,
                sellPrice: true
              }
            }
          }
        }
      }
    });

    // Calculate product performance
    const productMap = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.productId;
        if (!productMap[productId]) {
          productMap[productId] = {
            product: item.product,
            totalSales: 0,
            totalQuantity: 0,
            totalRevenue: 0,
            totalCost: 0,
            totalProfit: 0,
            averagePrice: 0,
            salesCount: 0,
            customers: new Set()
          };
        }
        
        const quantity = parseFloat(item.quantity);
        const revenue = parseFloat(item.totalPrice);
        const cost = quantity * parseFloat(item.product.costPrice);
        const profit = revenue - cost;
        
        productMap[productId].totalSales += 1;
        productMap[productId].totalQuantity += quantity;
        productMap[productId].totalRevenue += revenue;
        productMap[productId].totalCost += cost;
        productMap[productId].totalProfit += profit;
        productMap[productId].customers.add(sale.customerId);
      });
    });

    // Convert to array and calculate averages
    let productPerformance = Object.values(productMap).map(product => {
      return {
        ...product,
        averagePrice: product.totalRevenue / product.totalQuantity,
        profitMargin: product.totalRevenue > 0 
          ? (product.totalProfit / product.totalRevenue * 100).toFixed(2)
          : 0,
        customerCount: product.customers.size,
        customers: Array.from(product.customers).slice(0, 5) // Top 5 customers
      };
    });

    // Filter by category if specified
    if (category) {
      productPerformance = productPerformance.filter(
        product => product.product.category === category
      );
    }

    // Sort by profit (descending)
    productPerformance.sort((a, b) => b.totalProfit - a.totalProfit);

    // Get top N products
    const topProducts = productPerformance.slice(0, parseInt(topN));

    // Calculate summary
    const summary = {
      totalProducts: productPerformance.length,
      totalRevenue: productPerformance.reduce((sum, p) => sum + p.totalRevenue, 0),
      totalProfit: productPerformance.reduce((sum, p) => sum + p.totalProfit, 0),
      totalQuantity: productPerformance.reduce((sum, p) => sum + p.totalQuantity, 0),
      averageProfitMargin: productPerformance.length > 0 
        ? (productPerformance.reduce((sum, p) => sum + parseFloat(p.profitMargin), 0) / productPerformance.length).toFixed(2)
        : 0
    };

    res.status(200).json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary,
        topProducts,
        totalProducts: productPerformance.length
      }
    });

  } catch (error) {
    console.error('Get product performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate product performance report'
    });
  }
};

// ==================== EXPORT REPORTS ====================
exports.exportReport = async (req, res) => {
  try {
    const { type, format = 'excel' } = req.params;
    const { startDate, endDate, customerId, supplierId, groupBy } = req.query;
    const branchId = req.user?.branchId;

    let data = [];
    let reportName = '';
    let headers = [];

    // Fetch data based on report type
    switch (type) {
      case 'sales':
        reportName = 'Sales_Report';
        // Fetch sales data (using existing getSalesReport logic)
        const salesWhere = { status: 'completed' };
        if (branchId) salesWhere.branchId = branchId;
        if (startDate && endDate) {
          salesWhere.invoiceDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
          };
        }
        if (customerId) salesWhere.customerId = parseInt(customerId);

        const salesData = await prisma.sale.findMany({
          where: salesWhere,
          include: {
            customer: { select: { name: true, phone: true } },
            items: { include: { product: { select: { name: true, code: true } } } }
          },
          orderBy: { invoiceDate: 'desc' }
        });

        data = salesData.map(sale => ({
          'Invoice No': sale.invoiceNumber,
          'Date': sale.invoiceDate.toISOString().split('T')[0],
          'Customer': sale.customer?.name || 'N/A',
          'Customer Phone': sale.customer?.phone || 'N/A',
          'Total Amount': sale.totalAmount,
          'Paid Amount': sale.paidAmount,
          'Due Amount': sale.dueAmount,
          'Payment Status': sale.paymentStatus,
          'Items Count': sale.items.length,
          'Items': sale.items.map(item => 
            `${item.product?.name || item.productName} (${item.quantity} x ${item.unitPrice})`
          ).join('; ')
        }));

        headers = ['Invoice No', 'Date', 'Customer', 'Customer Phone', 'Total Amount', 'Paid Amount', 'Due Amount', 'Payment Status', 'Items Count', 'Items'];
        break;

      case 'purchase':
        reportName = 'Purchase_Report';
        // Fetch purchase data
        const purchaseWhere = {};
        if (branchId) purchaseWhere.branchId = branchId;
        if (startDate && endDate) {
          purchaseWhere.purchaseDate = {
            gte: new Date(startDate),
            lte: new Date(endDate)
          };
        }
        if (supplierId) purchaseWhere.supplierId = parseInt(supplierId);

        const purchaseData = await prisma.purchase.findMany({
          where: purchaseWhere,
          include: {
            supplier: { select: { name: true, company: true } },
            items: { include: { product: { select: { name: true, code: true } } } }
          },
          orderBy: { purchaseDate: 'desc' }
        });

        data = purchaseData.map(purchase => ({
          'Purchase No': purchase.purchaseNumber,
          'Date': purchase.purchaseDate.toISOString().split('T')[0],
          'Supplier': purchase.supplier?.name || 'N/A',
          'Supplier Company': purchase.supplier?.company || 'N/A',
          'Total Amount': purchase.totalAmount,
          'Paid Amount': purchase.paidAmount,
          'Due Amount': purchase.dueAmount,
          'Status': purchase.status,
          'Items Count': purchase.items.length,
          'Items': purchase.items.map(item => 
            `${item.product?.name || item.productName} (${item.quantity} x ${item.unitPrice})`
          ).join('; ')
        }));

        headers = ['Purchase No', 'Date', 'Supplier', 'Supplier Company', 'Total Amount', 'Paid Amount', 'Due Amount', 'Status', 'Items Count', 'Items'];
        break;

      case 'customer-ledger':
        reportName = 'Customer_Ledger';
        const { customerId: ledgerCustomerId } = req.query;
        
        if (!ledgerCustomerId) {
          return res.status(400).json({
            success: false,
            error: 'Customer ID is required for ledger report'
          });
        }

        const customer = await prisma.customer.findUnique({
          where: { id: parseInt(ledgerCustomerId) },
          select: { name: true, code: true }
        });

        // Get sales and payments for ledger
        const ledgerSales = await prisma.sale.findMany({
          where: { 
            customerId: parseInt(ledgerCustomerId),
            ...(branchId && { branchId }),
            ...(startDate && endDate && {
              invoiceDate: { gte: new Date(startDate), lte: new Date(endDate) }
            })
          },
          select: {
            invoiceNumber: true,
            invoiceDate: true,
            totalAmount: true,
            paidAmount: true,
            dueAmount: true
          },
          orderBy: { invoiceDate: 'asc' }
        });

        const ledgerPayments = await prisma.payment.findMany({
          where: { 
            customerId: parseInt(ledgerCustomerId),
            status: 'completed',
            ...(branchId && { branchId }),
            ...(startDate && endDate && {
              paymentDate: { gte: new Date(startDate), lte: new Date(endDate) }
            })
          },
          select: {
            referenceNo: true,
            paymentDate: true,
            amount: true,
            paymentMethod: true,
            notes: true
          },
          orderBy: { paymentDate: 'asc' }
        });

        // Combine and format ledger data
        const allEntries = [
          ...ledgerSales.map(sale => ({
            date: sale.invoiceDate,
            type: 'Sale',
            reference: sale.invoiceNumber,
            debit: sale.totalAmount,
            credit: 0,
            description: `Sale Invoice`
          })),
          ...ledgerPayments.map(payment => ({
            date: payment.paymentDate,
            type: 'Payment',
            reference: payment.referenceNo,
            debit: 0,
            credit: payment.amount,
            description: `Payment - ${payment.paymentMethod}${payment.notes ? ` - ${payment.notes}` : ''}`
          }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let balance = 0;
        data = allEntries.map(entry => {
          if (entry.type === 'Sale') {
            balance += parseFloat(entry.debit);
          } else {
            balance -= parseFloat(entry.credit);
          }
          return {
            'Date': entry.date.toISOString().split('T')[0],
            'Type': entry.type,
            'Reference': entry.reference,
            'Description': entry.description,
            'Debit': entry.debit,
            'Credit': entry.credit,
            'Balance': balance
          };
        });

        headers = ['Date', 'Type', 'Reference', 'Description', 'Debit', 'Credit', 'Balance'];
        reportName = `Customer_Ledger_${customer?.name || ledgerCustomerId}`;
        break;

      case 'product-performance':
        reportName = 'Product_Performance';
        // Fetch product performance data
        const productPerformanceData = await prisma.saleItem.groupBy({
          by: ['productId', 'productName'],
          where: {
            sale: {
              status: 'completed',
              ...(branchId && { branchId }),
              ...(startDate && endDate && {
                invoiceDate: { gte: new Date(startDate), lte: new Date(endDate) }
              })
            }
          },
          _sum: {
            quantity: true,
            totalPrice: true,
            profit: true
          },
          orderBy: {
            _sum: {
              totalPrice: 'desc'
            }
          }
        });

        data = productPerformanceData.map(item => ({
          'Product ID': item.productId,
          'Product Name': item.productName,
          'Quantity Sold': item._sum.quantity || 0,
          'Total Revenue': item._sum.totalPrice || 0,
          'Total Profit': item._sum.profit || 0,
          'Average Price': item._sum.quantity ? (item._sum.totalPrice / item._sum.quantity).toFixed(2) : 0,
          'Profit Margin': item._sum.totalPrice ? ((item._sum.profit / item._sum.totalPrice) * 100).toFixed(2) + '%' : '0%'
        }));

        headers = ['Product ID', 'Product Name', 'Quantity Sold', 'Total Revenue', 'Total Profit', 'Average Price', 'Profit Margin'];
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid report type'
        });
    }

    // Export based on format
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');
      
      // Add title
      worksheet.mergeCells('A1:' + String.fromCharCode(64 + headers.length) + '1');
      worksheet.getCell('A1').value = `${reportName} - ${new Date().toLocaleDateString()}`;
      worksheet.getCell('A1').font = { size: 14, bold: true };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };
      
      // Add headers
      worksheet.addRow(headers);
      
      // Style headers
      const headerRow = worksheet.getRow(2);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      // Add data rows
      data.forEach(item => {
        const row = headers.map(header => item[header] || '');
        worksheet.addRow(row);
      });
      
      // Auto fit columns
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = Math.min(maxLength + 2, 50);
      });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reportName}_${Date.now()}.xlsx`);
      
      // Send Excel file
      await workbook.xlsx.write(res);
      res.end();
    } 
    else if (format === 'csv') {
      // Create CSV content
      let csv = headers.join(',') + '\n';
      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header] || '';
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        });
        csv += row.join(',') + '\n';
      });
      
      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${reportName}_${Date.now()}.csv`);
      res.send(csv);
    }
    else if (format === 'pdf') {
      // Create PDF document
      const doc = new PDFDocument({ margin: 50 });
      const filename = `${reportName}_${Date.now()}.pdf`;
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Pipe PDF to response
      doc.pipe(res);
      
      // Add title
      doc.fontSize(18).text(reportName, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'center' });
      
      if (startDate && endDate) {
        doc.fontSize(10).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
      }
      doc.moveDown(2);
      
      // Create table
      const tableTop = doc.y;
      const rowHeight = 20;
      const colWidths = [80, 80, 80, 80, 80, 80, 80]; // Adjust based on headers
      
      // Draw headers
      doc.font('Helvetica-Bold');
      let x = 50;
      headers.slice(0, 7).forEach((header, i) => { // Show first 7 columns for PDF
        doc.text(header.substring(0, 15), x, tableTop, { width: colWidths[i], align: 'left' });
        x += colWidths[i];
      });
      
      // Draw rows
      doc.font('Helvetica');
      data.slice(0, 50).forEach((row, rowIndex) => { // Show first 50 rows in PDF
        x = 50;
        headers.slice(0, 7).forEach((header, colIndex) => {
          const value = row[header] || '';
          doc.text(String(value).substring(0, 20), x, tableTop + (rowIndex + 1) * rowHeight, { 
            width: colWidths[colIndex], 
            align: 'left' 
          });
          x += colWidths[colIndex];
        });
      });
      
      // Add page number
      doc.on('pageAdded', () => {
        doc.fontSize(10).text(
          `Page ${doc.pageNumber}`,
          50,
          doc.page.height - 50,
          { align: 'center', width: doc.page.width - 100 }
        );
      });
      
      doc.end();
    }
    else {
      // Return JSON data
      res.json({
        success: true,
        data: {
          reportName,
          headers,
          data,
          totalRecords: data.length,
          generatedAt: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      error: 'Export failed: ' + error.message
    });
  }
};

// ==================== DASHBOARD REPORTS ====================
exports.getDashboardReports = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Today's sales
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = await prisma.sale.aggregate({
      where: {
        invoiceDate: {
          gte: todayStart,
          lte: todayEnd
        },
        status: 'completed',
        branchId: branchId || 1
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true
      },
      _count: {
        id: true
      }
    });

    // Monthly sales
    const monthlySales = await prisma.sale.aggregate({
      where: {
        invoiceDate: {
          gte: firstDayOfMonth,
          lte: lastDayOfMonth
        },
        status: 'completed',
        branchId: branchId || 1
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true
      }
    });

    // Today's purchases
    const todayPurchases = await prisma.purchase.aggregate({
      where: {
        purchaseDate: {
          gte: todayStart,
          lte: todayEnd
        },
        status: 'received',
        branchId: branchId || 1
      },
      _sum: {
        totalAmount: true,
        paidAmount: true,
        dueAmount: true
      },
      _count: {
        id: true
      }
    });

    // Stock summary
    const stockSummary = await prisma.product.aggregate({
      where: {
        isActive: true,
        branchId: branchId || 1
      },
      _sum: {
        stockQuantity: true
      },
      _count: {
        id: true
      }
    });

    // Low stock items
    const lowStockItems = await prisma.product.count({
      where: {
        isActive: true,
        branchId: branchId || 1,
        stockQuantity: {
          lte: 5 // Adjust threshold as needed
        }
      }
    });

    // Recent sales (last 10)
    const recentSales = await prisma.sale.findMany({
      where: {
        status: 'completed',
        branchId: branchId || 1
      },
      include: {
        customer: {
          select: {
            name: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Recent purchases (last 10)
    const recentPurchases = await prisma.purchase.findMany({
      where: {
        branchId: branchId || 1
      },
      include: {
        supplier: {
          select: {
            name: true,
            company: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Customer summary
    const customerSummary = await prisma.customer.aggregate({
      where: {
        isActive: true,
        branchId: branchId || 1
      },
      _sum: {
        currentBalance: true
      },
      _count: {
        id: true
      }
    });

    // Supplier summary
    const supplierSummary = await prisma.supplier.aggregate({
      where: {
        isActive: true,
        branchId: branchId || 1
      },
      _sum: {
        currentBalance: true
      },
      _count: {
        id: true
      }
    });

    // Weekly sales data (last 7 days)
    const weeklySales = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const daySales = await prisma.sale.aggregate({
        where: {
          invoiceDate: {
            gte: dayStart,
            lte: dayEnd
          },
          status: 'completed',
          branchId: branchId || 1
        },
        _sum: {
          totalAmount: true
        }
      });

      weeklySales.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales: daySales._sum.totalAmount || 0
      });
    }

    // Top products by sales
    const topProducts = await prisma.saleItem.groupBy({
      by: ['productId', 'productName'],
      where: {
        sale: {
          status: 'completed',
          branchId: branchId || 1,
          invoiceDate: {
            gte: firstDayOfMonth
          }
        }
      },
      _sum: {
        quantity: true,
        totalPrice: true,
        profit: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 5
    });

    // Top customers
    const topCustomers = await prisma.sale.groupBy({
      by: ['customerId', 'customerName'],
      where: {
        status: 'completed',
        branchId: branchId || 1,
        invoiceDate: {
          gte: firstDayOfMonth
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc'
        }
      },
      take: 5
    });

    res.status(200).json({
      success: true,
      data: {
        today: {
          sales: todaySales._sum.totalAmount || 0,
          salesCount: todaySales._count.id || 0,
          collections: todaySales._sum.paidAmount || 0,
          due: todaySales._sum.dueAmount || 0,
          purchases: todayPurchases._sum.totalAmount || 0,
          purchaseCount: todayPurchases._count.id || 0
        },
        monthly: {
          sales: monthlySales._sum.totalAmount || 0,
          collections: monthlySales._sum.paidAmount || 0,
          due: monthlySales._sum.dueAmount || 0
        },
        inventory: {
          totalProducts: stockSummary._count.id || 0,
          totalStock: stockSummary._sum.stockQuantity || 0,
          lowStockItems
        },
        customers: {
          total: customerSummary._count.id || 0,
          totalDue: customerSummary._sum.currentBalance || 0
        },
        suppliers: {
          total: supplierSummary._count.id || 0,
          totalDue: supplierSummary._sum.currentBalance || 0
        },
        recent: {
          sales: recentSales,
          purchases: recentPurchases
        },
        charts: {
          weeklySales,
          topProducts,
          topCustomers
        },
        summary: {
          netCashFlow: (todaySales._sum.paidAmount || 0) - (todayPurchases._sum.paidAmount || 0),
          profitEstimate: todaySales._sum.totalAmount 
            ? ((todaySales._sum.totalAmount - (todayPurchases._sum.totalAmount || 0)) / todaySales._sum.totalAmount * 100).toFixed(2)
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate dashboard reports'
    });
  }
};