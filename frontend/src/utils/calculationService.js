/**
 * Tanisha Enterprise Real-time Calculation Service
 * Professional business calculations for dashboard
 */

export const calculationService = {
  // Calculate Today's Sales
  calculateTodaysSales: (salesData) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysSales = salesData
      .filter(sale => sale.date === today)
      .reduce((sum, sale) => sum + sale.amount, 0);
    
    return todaysSales;
  },

  // Calculate Today's Profit
  calculateTodaysProfit: (salesData, costData) => {
    const today = new Date().toISOString().split('T')[0];
    
    const todaysRevenue = salesData
      .filter(sale => sale.date === today)
      .reduce((sum, sale) => sum + sale.amount, 0);
    
    const todaysCost = costData
      .filter(cost => cost.date === today)
      .reduce((sum, cost) => sum + cost.amount, 0);
    
    return todaysRevenue - todaysCost;
  },

  // Calculate Monthly Revenue
  calculateMonthlyRevenue: (salesData) => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlySales = salesData
      .filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === currentMonth && 
               saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + sale.amount, 0);
    
    return monthlySales;
  },

  // Calculate Stock Value
  calculateStockValue: (products) => {
    return products.reduce((total, product) => {
      return total + (product.stockQuantity * product.costPrice);
    }, 0);
  },

  // Calculate Customer Due
  calculateCustomerDue: (customers) => {
    return customers.reduce((total, customer) => {
      return total + (customer.totalDue || 0);
    }, 0);
  },

  // Calculate Weekly Sales Summary
  calculateWeeklySummary: (salesData) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklySummary = {};
    
    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = days[date.getDay()];
      
      const daySales = salesData
        .filter(sale => sale.date === dateStr)
        .reduce((sum, sale) => sum + sale.amount, 0);
      
      weeklySummary[dateStr] = {
        day: dayName,
        sales: daySales,
        formattedDate: date.toLocaleDateString('en-GB', { 
          day: '2-digit',
          month: 'short'
        })
      };
    }
    
    return weeklySummary;
  },

  // Calculate Service Statistics
  calculateServiceStats: (serviceRequests) => {
    return {
      total: serviceRequests.length,
      inProgress: serviceRequests.filter(req => req.status === 'In Progress').length,
      completed: serviceRequests.filter(req => req.status === 'Completed').length,
      pending: serviceRequests.filter(req => req.status === 'Pending').length,
      revenue: serviceRequests.reduce((sum, req) => sum + (req.serviceCharge || 0), 0)
    };
  },

  // Calculate Profit Margin
  calculateProfitMargin: (revenue, cost) => {
    if (revenue === 0) return 0;
    return ((revenue - cost) / revenue * 100).toFixed(2);
  },

  // Format Currency (BDT)
  formatBDT: (amount) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  },

  // Calculate Average Order Value
  calculateAOV: (totalRevenue, numberOfOrders) => {
    if (numberOfOrders === 0) return 0;
    return totalRevenue / numberOfOrders;
  },

  // Calculate Inventory Turnover
  calculateInventoryTurnover: (costOfGoodsSold, averageInventory) => {
    if (averageInventory === 0) return 0;
    return costOfGoodsSold / averageInventory;
  }
};

/**
 * Real-time Data Updater
 * Automatically updates dashboard metrics when data changes
 */
export class RealTimeCalculator {
  constructor() {
    this.subscribers = new Set();
    this.currentData = null;
  }

  // Subscribe to real-time updates
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  // Update data and notify subscribers
  updateData(newData) {
    this.currentData = newData;
    
    // Calculate all metrics
    const metrics = {
      todaysSales: calculationService.calculateTodaysSales(newData.sales || []),
      todaysProfit: calculationService.calculateTodaysProfit(newData.sales || [], newData.costs || []),
      monthlyRevenue: calculationService.calculateMonthlyRevenue(newData.sales || []),
      stockValue: calculationService.calculateStockValue(newData.products || []),
      customerDue: calculationService.calculateCustomerDue(newData.customers || []),
      weeklySummary: calculationService.calculateWeeklySummary(newData.sales || []),
      serviceStats: calculationService.calculateServiceStats(newData.serviceRequests || [])
    };

    // Notify all subscribers
    this.subscribers.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in real-time update callback:', error);
      }
    });

    return metrics;
  }

  // Get current metrics
  getCurrentMetrics() {
    if (!this.currentData) return null;
    return {
      todaysSales: calculationService.calculateTodaysSales(this.currentData.sales || []),
      todaysProfit: calculationService.calculateTodaysProfit(this.currentData.sales || [], this.currentData.costs || []),
      monthlyRevenue: calculationService.calculateMonthlyRevenue(this.currentData.sales || []),
      stockValue: calculationService.calculateStockValue(this.currentData.products || []),
      customerDue: calculationService.calculateCustomerDue(this.currentData.customers || [])
    };
  }
}

// Singleton instance
export const realTimeCalculator = new RealTimeCalculator();