const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const dashboardController = {
  getDashboardSummary: async (req, res) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfWeek = new Date(today.setDate(today.getDate() - 7));

      const [
        todaySales,
        monthlyRevenue,
        totalCustomers,
        totalProducts,
        pendingOrders,
        lowStockProducts,
        recentSales,
        topProducts,
        recentCustomers,
        serviceRequests
      ] = await Promise.all([
        prisma.sale.aggregate({
          where: { 
            createdAt: { gte: startOfDay },
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true },
          _count: true
        }),

        prisma.sale.aggregate({
          where: { 
            createdAt: { gte: startOfMonth },
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true }
        }),

        prisma.customer.count({ where: { isActive: true } }),

        prisma.product.count(),

        prisma.sale.count({ where: { status: 'PENDING' } }),

        prisma.product.count({ 
          where: { 
            currentStock: { lt: 5 }
          }
        }),

        prisma.sale.findMany({
          take: 5,
          where: { status: 'COMPLETED' },
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: { name: true, phone: true }
            },
            items: {
              include: {
                product: {
                  select: { name: true }
                }
              }
            }
          }
        }),

        prisma.$queryRaw`
          SELECT 
            p.id, 
            p.code, 
            p.name, 
            p.currentStock as stock,
            COALESCE(SUM(si.quantity), 0) as sold,
            p.sellPrice as price
          FROM "Product" p
          LEFT JOIN "SaleItem" si ON p.id = si."productId"
          LEFT JOIN "Sale" s ON si."saleId" = s.id AND s.status = 'COMPLETED'
          GROUP BY p.id, p.code, p.name, p.currentStock, p.sellPrice
          ORDER BY sold DESC
          LIMIT 5
        `,

        prisma.customer.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            createdAt: true
          }
        }),

        prisma.serviceRequest.count({ 
          where: { status: 'PENDING' }
        })
      ]);

      const weeklySales = await prisma.sale.findMany({
        where: {
          createdAt: { gte: startOfWeek },
          status: 'COMPLETED'
        },
        select: {
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });

      const salesByDay = {};
      weeklySales.forEach(sale => {
        const day = sale.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        salesByDay[day] = (salesByDay[day] || 0) + parseFloat(sale.totalAmount);
      });

      const chartData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
        day,
        sales: salesByDay[day] || 0
      }));

      const productCategories = await prisma.$queryRaw`
        SELECT 
          c.name as categoryName,
          COUNT(p.id) as productCount
        FROM "Category" c
        LEFT JOIN "Product" p ON c.id = p."categoryId"
        GROUP BY c.id, c.name
        ORDER BY productCount DESC
      `;

      const revenueTrend = await prisma.$queryRaw`
        SELECT 
          TO_CHAR(s."createdAt", 'Mon') as month,
          EXTRACT(YEAR FROM s."createdAt") as year,
          COALESCE(SUM(s."totalAmount"), 0) as revenue
        FROM "Sale" s
        WHERE s.status = 'COMPLETED' 
          AND s."createdAt" >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY TO_CHAR(s."createdAt", 'Mon'), EXTRACT(YEAR FROM s."createdAt"), EXTRACT(MONTH FROM s."createdAt")
        ORDER BY EXTRACT(YEAR FROM s."createdAt"), EXTRACT(MONTH FROM s."createdAt")
      `;

      res.json({
        success: true,
        data: {
          summary: {
            todaySales: todaySales._sum.totalAmount || 0,
            todayOrders: todaySales._count || 0,
            monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
            totalCustomers,
            totalProducts,
            pendingOrders,
            lowStockProducts,
            pendingServices: serviceRequests
          },
          recentSales: recentSales.map(sale => ({
            id: sale.id,
            invoiceNo: sale.invoiceNumber,
            customer: sale.customer?.name || 'Walk-in Customer',
            amount: sale.totalAmount,
            date: sale.createdAt,
            items: sale.items.map(item => item.product.name).join(', ')
          })),
          topProducts: topProducts.map(product => ({
            id: product.id,
            name: product.name,
            code: product.code,
            stock: Number(product.stock),
            sold: Number(product.sold),
            price: Number(product.price)
          })),
          recentCustomers: recentCustomers.map(customer => ({
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            joined: customer.createdAt
          })),
          charts: {
            weeklySales: chartData,
            productCategories: productCategories.map(cat => ({
              name: cat.categoryname,
              count: Number(cat.productcount)
            })),
            revenueTrend: revenueTrend.map(rt => ({
              month: rt.month,
              revenue: Number(rt.revenue)
            }))
          }
        }
      });

    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch dashboard data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  getQuickStats: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayStats, monthlyStats] = await Promise.all([
        prisma.sale.aggregate({
          where: { 
            createdAt: { gte: today },
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true },
          _count: true
        }),
        prisma.sale.aggregate({
          where: { 
            createdAt: { 
              gte: new Date(today.getFullYear(), today.getMonth(), 1)
            },
            status: 'COMPLETED'
          },
          _sum: { totalAmount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          today: {
            sales: todayStats._sum.totalAmount || 0,
            orders: todayStats._count || 0
          },
          monthly: {
            revenue: monthlyStats._sum.totalAmount || 0
          }
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  getSalesChartData: async (req, res) => {
    try {
      const { period = 'week' } = req.query;
      let startDate = new Date();

      switch (period) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setDate(startDate.getDate() - 7);
      }

      const sales = await prisma.sale.findMany({
        where: {
          createdAt: { gte: startDate },
          status: 'COMPLETED'
        },
        select: {
          totalAmount: true,
          createdAt: true
        },
        orderBy: { createdAt: 'asc' }
      });

      const groupedData = {};
      sales.forEach(sale => {
        let key;
        if (period === 'week') {
          key = sale.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
        } else if (period === 'month') {
          key = `Day ${sale.createdAt.getDate()}`;
        } else {
          key = sale.createdAt.toLocaleDateString('en-US', { month: 'short' });
        }
        
        groupedData[key] = (groupedData[key] || 0) + parseFloat(sale.totalAmount);
      });

      const chartData = Object.keys(groupedData).map(key => ({
        label: key,
        value: groupedData[key]
      }));

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  getLowStockProducts: async (req, res) => {
    try {
      const products = await prisma.product.findMany({
        where: {
          currentStock: { lt: 5 }
        },
        orderBy: { currentStock: 'asc' },
        take: 10,
        select: {
          id: true,
          code: true,
          name: true,
          currentStock: true,
          sellPrice: true,
          reorderLevel: true
        }
      });

      res.json({
        success: true,
        data: products
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  },

  getPendingOrders: async (req, res) => {
    try {
      const orders = await prisma.sale.findMany({
        where: { status: 'PENDING' },
        include: {
          customer: {
            select: { name: true, phone: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      res.json({
        success: true,
        data: orders.map(order => ({
          id: order.id,
          invoiceNumber: order.invoiceNumber,
          customerName: order.customer?.name,
          totalAmount: order.totalAmount,
          createdAt: order.createdAt
        }))
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  }
};

module.exports = dashboardController;