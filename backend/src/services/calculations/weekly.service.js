/**
 * সাপ্তাহিক হিসাব সার্ভিস (শনি-বৃহস্পতি)
 * Prepared by Eng Tanbir Rifat | MaxoraSoft
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class WeeklyCalculationService {
  /**
   * বাংলাদেশের কর্মসপ্তাহ বের করো (শনি-বৃহস্পতি)
   * @param {Date} date - তারিখ
   * @returns {Object} সপ্তাহের তথ্য
   */
  static getBangladeshBusinessWeek(date = new Date()) {
    const currentDate = new Date(date);
    const currentDay = currentDate.getDay(); // 0=রবি, 6=শনি
    
    // শনিবার খুঁজে বের করো
    let saturday = new Date(currentDate);
    if (currentDay === 5) { // শুক্রবার - আগের শনিবার
      saturday.setDate(saturday.getDate() - 6);
    } else if (currentDay === 6) { // শনিবার
      // ইতিমধ্যে শনিবার
    } else {
      saturday.setDate(saturday.getDate() - currentDay - 1);
    }
    
    // বৃহস্পতিবার বের করো
    let thursday = new Date(saturday);
    thursday.setDate(thursday.getDate() + 5);
    
    // টাইম রিসেট করো
    saturday.setHours(0, 0, 0, 0);
    thursday.setHours(23, 59, 59, 999);
    
    // সপ্তাহ নম্বর বের করো
    const weekNumber = this.getWeekNumber(saturday);
    
    return {
      startDate: saturday,
      endDate: thursday,
      weekNumber,
      year: saturday.getFullYear(),
      banglaYear: saturday.getFullYear() - 593
    };
  }
  
  /**
   * সপ্তাহ নম্বর বের করো
   */
  static getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  
  /**
   * সাপ্তাহিক সারাংশ ক্যালকুলেট করো
   */
  static async calculateWeeklySummary(branchId, weekOffset = 0) {
    try {
      // সপ্তাহের তারিখ রেঞ্জ বের করো
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (weekOffset * 7));
      const week = this.getBangladeshBusinessWeek(targetDate);
      
      // বিক্রয় ডাটা fetch করো
      const sales = await prisma.sale.findMany({
        where: {
          branchId,
          date: {
            gte: week.startDate,
            lte: week.endDate
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
      
      // ক্রয় ডাটা fetch করো
      const purchases = await prisma.purchase.findMany({
        where: {
          branchId,
          date: {
            gte: week.startDate,
            lte: week.endDate
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
      
      // পেমেন্ট ডাটা fetch করো
      const customerPayments = await prisma.customerPayment.findMany({
        where: {
          customer: {
            sales: {
              some: {
                branchId,
                date: {
                  gte: week.startDate,
                  lte: week.endDate
                }
              }
            }
          },
          date: {
            gte: week.startDate,
            lte: week.endDate
          }
        }
      });
      
      // দৈনিক ডাটা প্রস্তুত করো
      const dailyData = this.prepareDailyData(week, sales, customerPayments);
      
      // সামারি ক্যালকুলেট করো
      const summary = this.calculateSummary(sales, purchases, customerPayments);
      
      // গত সপ্তাহের সাথে তুলনা
      const comparison = await this.compareWithLastWeek(branchId, week, summary.totalSales);
      
      return {
        success: true,
        data: {
          weekInfo: {
            ...week,
            startDate: week.startDate.toISOString().split('T')[0],
            endDate: week.endDate.toISOString().split('T')[0],
            banglaStartDate: this.toBanglaDate(week.startDate),
            banglaEndDate: this.toBanglaDate(week.endDate)
          },
          dailyData,
          summary,
          comparison,
          salesCount: sales.length,
          purchaseCount: purchases.length,
          paymentCount: customerPayments.length
        }
      };
    } catch (error) {
      console.error('Weekly calculation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * দৈনিক ডাটা প্রস্তুত করো
   */
  static prepareDailyData(week, sales, payments) {
    const days = [];
    const dayNames = ['শনি', 'রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি'];
    
    for (let i = 0; i < 6; i++) {
      const dayDate = new Date(week.startDate);
      dayDate.setDate(dayDate.getDate() + i);
      const dayKey = dayDate.toISOString().split('T')[0];
      
      // দিনের বিক্রয়
      const daySales = sales.filter(sale => 
        sale.date.toISOString().split('T')[0] === dayKey
      );
      
      // দিনের সংগ্রহ
      const dayPayments = payments.filter(payment => 
        payment.date.toISOString().split('T')[0] === dayKey
      );
      
      const totalSales = daySales.reduce((sum, sale) => sum + parseFloat(sale.grandTotal), 0);
      const totalCollections = dayPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
      
      // লাভ ক্যালকুলেট করো
      let totalProfit = 0;
      daySales.forEach(sale => {
        sale.items.forEach(item => {
          const costPrice = parseFloat(item.product.costPrice) * item.quantity;
          const sellPrice = parseFloat(item.totalPrice);
          totalProfit += (sellPrice - costPrice);
        });
      });
      
      days.push({
        day: dayNames[i],
        date: dayKey,
        sales: totalSales,
        collections: totalCollections,
        profit: totalProfit,
        due: totalSales - totalCollections,
        transactionCount: daySales.length + dayPayments.length
      });
    }
    
    return days;
  }
  
  /**
   * সাপ্তাহিক সারাংশ
   */
  static calculateSummary(sales, purchases, payments) {
    // মোট বিক্রয়
    const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.grandTotal), 0);
    
    // মোট সংগ্রহ
    const totalCollections = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    // মোট ক্রয় খরচ
    let totalPurchaseCost = 0;
    purchases.forEach(purchase => {
      purchase.items.forEach(item => {
        totalPurchaseCost += parseFloat(item.totalPrice);
      });
    });
    
    // মোট লাভ
    let totalProfit = 0;
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const costPrice = parseFloat(item.product.costPrice) * item.quantity;
        const sellPrice = parseFloat(item.totalPrice);
        totalProfit += (sellPrice - costPrice);
      });
    });
    
    // বকেয়া
    const totalDue = totalSales - totalCollections;
    
    // লক্ষ্য অর্জন (ডেমো - প্রকৃতপক্ষে টার্গেট ডাটাবেস থেকে আসবে)
    const weeklyTarget = 1000000; // ১০ লক্ষ টাকা
    const targetAchievement = Math.min((totalSales / weeklyTarget) * 100, 100);
    
    // সাপ্তাহিক বৃদ্ধি (ডেমো)
    const weeklyGrowth = 15.2;
    
    return {
      totalSales,
      totalCollections,
      totalPurchaseCost,
      totalProfit,
      totalDue,
      targetAchievement: Math.round(targetAchievement),
      weeklyGrowth,
      averageDailySales: totalSales / 6,
      averageDailyProfit: totalProfit / 6
    };
  }
  
  /**
   * গত সপ্তাহের সাথে তুলনা
   */
  static async compareWithLastWeek(branchId, currentWeek, currentSales) {
    try {
      const lastWeekDate = new Date(currentWeek.startDate);
      lastWeekDate.setDate(lastWeekDate.getDate() - 7);
      const lastWeek = this.getBangladeshBusinessWeek(lastWeekDate);
      
      const lastWeekSales = await prisma.sale.aggregate({
        where: {
          branchId,
          date: {
            gte: lastWeek.startDate,
            lte: lastWeek.endDate
          },
          status: {
            in: ['COMPLETED', 'PARTIAL']
          }
        },
        _sum: {
          grandTotal: true
        }
      });
      
      const lastWeekTotal = parseFloat(lastWeekSales._sum.grandTotal) || 0;
      
      let growthPercentage = 0;
      if (lastWeekTotal > 0) {
        growthPercentage = ((currentSales - lastWeekTotal) / lastWeekTotal) * 100;
      }
      
      return {
        lastWeekTotal,
        growthPercentage: parseFloat(growthPercentage.toFixed(1)),
        trend: growthPercentage >= 0 ? 'up' : 'down',
        comparison: currentSales > lastWeekTotal ? 'better' : 'worse'
      };
    } catch (error) {
      console.error('Comparison error:', error);
      return {
        lastWeekTotal: 0,
        growthPercentage: 0,
        trend: 'stable',
        comparison: 'same'
      };
    }
  }
  
  /**
   * বাংলা তারিখে কনভার্ট করো
   */
  static toBanglaDate(date) {
    const banglaMonths = [
      'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
      'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র'
    ];
    
    const day = date.getDate();
    const month = banglaMonths[date.getMonth()];
    const year = date.getFullYear() - 593;
    
    return `${day} ${month} ${year}`;
  }
  
  /**
   * সাপ্তাহিক রিপোর্ট জেনারেট করো
   */
  static async generateWeeklyReport(branchId, weekOffset = 0, format = 'json') {
    const weeklyData = await this.calculateWeeklySummary(branchId, weekOffset);
    
    if (!weeklyData.success) {
      return weeklyData;
    }
    
    const { data } = weeklyData;
    
    // JSON ফরম্যাট
    if (format === 'json') {
      return {
        success: true,
        data: {
          reportType: 'WEEKLY_SUMMARY',
          generatedAt: new Date().toISOString(),
          timezone: 'Asia/Dhaka',
          ...data
        }
      };
    }
    
    // CSV ফরম্যাট
    if (format === 'csv') {
      const csvData = this.formatAsCSV(data);
      return {
        success: true,
        data: csvData,
        contentType: 'text/csv',
        filename: `weekly-report-${data.weekInfo.weekNumber}.csv`
      };
    }
    
    return {
      success: false,
      error: 'Unsupported format'
    };
  }
  
  /**
   * CSV ফরম্যাটে কনভার্ট করো
   */
  static formatAsCSV(data) {
    const headers = ['দিন', 'তারিখ', 'বিক্রয় (৳)', 'সংগ্রহ (৳)', 'লাভ (৳)', 'বাকি (৳)', 'লেনদেন সংখ্যা'];
    
    const rows = data.dailyData.map(day => [
      day.day,
      day.date,
      day.sales.toFixed(2),
      day.collections.toFixed(2),
      day.profit.toFixed(2),
      day.due.toFixed(2),
      day.transactionCount
    ]);
    
    // সামারি সারি যোগ করো
    rows.push(['সাপ্তাহিক মোট', '', 
      data.summary.totalSales.toFixed(2),
      data.summary.totalCollections.toFixed(2),
      data.summary.totalProfit.toFixed(2),
      data.summary.totalDue.toFixed(2),
      data.salesCount + data.paymentCount
    ]);
    
    // CSV স্ট্রিং তৈরি করো
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    return csvContent;
  }
}

module.exports = WeeklyCalculationService;
