/**
 * লাভ-ক্ষতি ক্যালকুলেশন সার্ভিস
 * Prepared by Eng Tanbir Rifat | MaxoraSoft
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class ProfitCalculationService {
  /**
   * নির্দিষ্ট তারিখ রেঞ্জের লাভ-ক্ষতি বের করো
   */
  static async calculateProfitLoss(branchId, startDate, endDate) {
    try {
      // বিক্রয় ডাটা
      const sales = await prisma.sale.findMany({
        where: {
          branchId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          },
          status: {
            in: ['COMPLETED', 'PARTIAL']
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          },
          payments: true
        }
      });
      
      // ক্রয় ডাটা
      const purchases = await prisma.purchase.findMany({
        where: {
          branchId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      // খরচ ডাটা (হিসাবের খাত থেকে)
      const expenses = await prisma.transaction.findMany({
        where: {
          branchId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          },
          debitAccount: {
            type: 'EXPENSE'
          }
        }
      });
      
      // আয় ডাটা (হিসাবের খাত থেকে)
      const incomes = await prisma.transaction.findMany({
        where: {
          branchId,
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          },
          creditAccount: {
            type: 'INCOME'
          }
        }
      });
      
      // ক্যালকুলেশন
      const calculations = this.performCalculations(sales, purchases, expenses, incomes);
      
      return {
        success: true,
        data: {
          period: {
            startDate,
            endDate,
            days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
          },
          ...calculations,
          metadata: {
            salesCount: sales.length,
            purchaseCount: purchases.length,
            expenseCount: expenses.length,
            incomeCount: incomes.length
          }
        }
      };
    } catch (error) {
      console.error('Profit calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * সকল ক্যালকুলেশন পারফর্ম করো
   */
  static performCalculations(sales, purchases, expenses, incomes) {
    // ১. মোট বিক্রয় আয়
    const totalSalesRevenue = sales.reduce((sum, sale) => 
      sum + parseFloat(sale.grandTotal), 0
    );
    
    // ২. মোট বিক্রয় খরচ (ক্রয় মূল্য)
    let totalCostOfGoodsSold = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const costPrice = parseFloat(item.product.costPrice) * item.quantity;
        totalCostOfGoodsSold += costPrice;
      });
    });
    
    // ৩. স্থূল লাভ (Gross Profit)
    const grossProfit = totalSalesRevenue - totalCostOfGoodsSold;
    
    // ৪. মোট অপারেটিং খরচ
    const totalOperatingExpenses = expenses.reduce((sum, expense) => 
      sum + parseFloat(expense.amount), 0
    );
    
    // ৫. অন্যান্য আয়
    const totalOtherIncome = incomes.reduce((sum, income) => 
      sum + parseFloat(income.amount), 0
    );
    
    // ৬. অপারেটিং লাভ (Operating Profit)
    const operatingProfit = grossProfit - totalOperatingExpenses;
    
    // ৭. নেট লাভ (Net Profit)
    const netProfit = operatingProfit + totalOtherIncome;
    
    // ৮. মার্জিন ক্যালকুলেশন
    const grossMargin = totalSalesRevenue > 0 ? (grossProfit / totalSalesRevenue) * 100 : 0;
    const operatingMargin = totalSalesRevenue > 0 ? (operatingProfit / totalSalesRevenue) * 100 : 0;
    const netMargin = totalSalesRevenue > 0 ? (netProfit / totalSalesRevenue) * 100 : 0;
    
    // ৯. বিক্রয় আইটেম ভিত্তিক লাভ
    const salesByProduct = this.calculateProfitByProduct(sales);
    
    // ১০. দৈনিক লাভ ট্রেন্ড
    const dailyProfitTrend = this.calculateDailyTrend(sales, purchases, expenses);
    
    return {
      revenue: {
        totalSalesRevenue,
        totalOtherIncome,
        totalRevenue: totalSalesRevenue + totalOtherIncome
      },
      costs: {
        totalCostOfGoodsSold,
        totalOperatingExpenses,
        totalCosts: totalCostOfGoodsSold + totalOperatingExpenses
      },
      profit: {
        grossProfit,
        operatingProfit,
        netProfit,
        grossMargin: parseFloat(grossMargin.toFixed(2)),
        operatingMargin: parseFloat(operatingMargin.toFixed(2)),
        netMargin: parseFloat(netMargin.toFixed(2))
      },
      breakdown: {
        salesByProduct,
        dailyProfitTrend
      },
      formulas: {
        grossProfitFormula: 'মোট বিক্রয় আয় - বিক্রয়কৃত পণ্যের মূল্য',
        operatingProfitFormula: 'স্থূল লাভ - অপারেটিং খরচ',
        netProfitFormula: 'অপারেটিং লাভ + অন্যান্য আয়',
        grossMarginFormula: '(স্থূল লাভ ÷ মোট বিক্রয় আয়) × ১০০',
        netMarginFormula: '(নিট লাভ ÷ মোট বিক্রয় আয়) × ১০০'
      }
    };
  }
  
  /**
   * পণ্য ভিত্তিক লাভ ক্যালকুলেশন
   */
  static calculateProfitByProduct(sales) {
    const productMap = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.productId;
        const productName = item.product.name;
        const quantity = item.quantity;
        const costPrice = parseFloat(item.product.costPrice);
        const sellPrice = parseFloat(item.unitPrice);
        
        if (!productMap[productId]) {
          productMap[productId] = {
            productId,
            productName,
            totalQuantity: 0,
            totalCost: 0,
            totalRevenue: 0,
            totalProfit: 0
          };
        }
        
        productMap[productId].totalQuantity += quantity;
        productMap[productId].totalCost += costPrice * quantity;
        productMap[productId].totalRevenue += sellPrice * quantity;
        productMap[productId].totalProfit += (sellPrice - costPrice) * quantity;
      });
    });
    
    // অ্যারে তে কনভার্ট করো এবং লাভ অনুসারে সাজাও
    return Object.values(productMap)
      .map(product => ({
        ...product,
        profitMargin: product.totalRevenue > 0 
          ? (product.totalProfit / product.totalRevenue) * 100 
          : 0
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit);
  }
  
  /**
   * দৈনিক লাভ ট্রেন্ড
   */
  static calculateDailyTrend(sales, purchases, expenses) {
    const dateMap = {};
    
    // সকল তারিখ সংগ্রহ করো
    const allDates = [
      ...sales.map(s => s.date.toISOString().split('T')[0]),
      ...purchases.map(p => p.date.toISOString().split('T')[0]),
      ...expenses.map(e => e.date.toISOString().split('T')[0])
    ];
    
    const uniqueDates = [...new Set(allDates)].sort();
    
    // প্রতিটি তারিখের জন্য ক্যালকুলেশন
    uniqueDates.forEach(dateStr => {
      // দিনের বিক্রয়
      const daySales = sales.filter(s => 
        s.date.toISOString().split('T')[0] === dateStr
      );
      
      // দিনের ক্রয়
      const dayPurchases = purchases.filter(p => 
        p.date.toISOString().split('T')[0] === dateStr
      );
      
      // দিনের খরচ
      const dayExpenses = expenses.filter(e => 
        e.date.toISOString().split('T')[0] === dateStr
      );
      
      // বিক্রয় আয়
      const salesRevenue = daySales.reduce((sum, sale) => 
        sum + parseFloat(sale.grandTotal), 0
      );
      
      // বিক্রয় খরচ
      let salesCost = 0;
      daySales.forEach(sale => {
        sale.items.forEach(item => {
          const costPrice = parseFloat(item.product.costPrice) * item.quantity;
          salesCost += costPrice;
        });
      });
      
      // ক্রয় খরচ
      const purchaseCost = dayPurchases.reduce((sum, purchase) => {
        return sum + purchase.items.reduce((itemSum, item) => 
          itemSum + parseFloat(item.totalPrice), 0
        );
      }, 0);
      
      // অপারেটিং খরচ
      const operatingCost = dayExpenses.reduce((sum, expense) => 
        sum + parseFloat(expense.amount), 0
      );
      
      // দিনের লাভ
      const dailyProfit = salesRevenue - salesCost - operatingCost;
      
      dateMap[dateStr] = {
        date: dateStr,
        salesRevenue,
        salesCost,
        purchaseCost,
        operatingCost,
        dailyProfit,
        profitMargin: salesRevenue > 0 ? (dailyProfit / salesRevenue) * 100 : 0
      };
    });
    
    // তারিখ অনুসারে সাজাও
    return Object.values(dateMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
  }
  
  /**
   * আজকের লাভ-ক্ষতি
   */
  static async calculateTodaysProfitLoss(branchId) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    return this.calculateProfitLoss(
      branchId,
      startOfDay.toISOString(),
      endOfDay.toISOString()
    );
  }
  
  /**
   * এই মাসের লাভ-ক্ষতি
   */
  static async calculateMonthlyProfitLoss(branchId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return this.calculateProfitLoss(
      branchId,
      startDate.toISOString(),
      endDate.toISOString()
    );
  }
  
  /**
   * লাভ-ক্ষতি রিপোর্ট জেনারেট করো
   */
  static async generateProfitLossReport(branchId, startDate, endDate, format = 'json') {
    const profitData = await this.calculateProfitLoss(branchId, startDate, endDate);
    
    if (!profitData.success) {
      return profitData;
    }
    
    const { data } = profitData;
    
    if (format === 'json') {
      return {
        success: true,
        data: {
          reportType: 'PROFIT_LOSS',
          generatedAt: new Date().toISOString(),
          timezone: 'Asia/Dhaka',
          ...data
        }
      };
    }
    
    // অন্যান্য ফরম্যাটের জন্য (PDF, CSV) এক্সটেনশন পয়েন্ট
    return {
      success: false,
      error: 'Format not implemented yet'
    };
  }
}

module.exports = ProfitCalculationService;
