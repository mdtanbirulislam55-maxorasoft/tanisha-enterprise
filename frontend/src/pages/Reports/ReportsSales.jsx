import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { reportsAPI } from '../../services/api';
import {
  BarChart3, Download, Printer, Filter,
  Calendar, TrendingUp, TrendingDown,
  DollarSign, Users, Package, PieChart,
  Search, RefreshCw, Eye, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const ReportsSales = () => {
  const { theme } = useTheme();
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [filters, setFilters] = useState({
    customerId: '',
    productId: '',
    category: '',
    paymentStatus: '',
    salesPerson: ''
  });

  useEffect(() => {
    fetchReport();
  }, [reportType, dateRange, filters]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let response;
      const params = { ...dateRange, ...filters };

      switch (reportType) {
        case 'summary':
          response = await reportsAPI.getSalesSummary(params);
          break;
        case 'by-product':
          response = await reportsAPI.getSalesByProduct(params);
          break;
        case 'by-customer':
          response = await reportsAPI.getSalesByCustomer(params);
          break;
        case 'by-category':
          response = await reportsAPI.getSalesByCategory(params);
          break;
        case 'daily':
          response = await reportsAPI.getDailySales(params);
          break;
        case 'monthly':
          response = await reportsAPI.getMonthlySales(params);
          break;
        case 'yearly':
          response = await reportsAPI.getYearlySales(params);
          break;
        default:
          response = await reportsAPI.getSalesSummary(params);
      }

      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      toast.info(`Exporting ${reportType} report as ${format.toUpperCase()}...`);
      // Implement export functionality
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderReport = () => {
    if (!reportData) return null;

    switch (reportType) {
      case 'summary':
        return <SalesSummaryReport data={reportData} />;
      case 'by-product':
        return <SalesByProductReport data={reportData} />;
      case 'by-customer':
        return <SalesByCustomerReport data={reportData} />;
      case 'by-category':
        return <SalesByCategoryReport data={reportData} />;
      case 'daily':
        return <DailySalesReport data={reportData} />;
      case 'monthly':
        return <MonthlySalesReport data={reportData} />;
      case 'yearly':
        return <YearlySalesReport data={reportData} />;
      default:
        return <SalesSummaryReport data={reportData} />;
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <BarChart3 className="mr-3" />
                Sales Reports (বিক্রয় রিপোর্ট)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Comprehensive Sales Analysis
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-700 hover:bg-red-500/30 flex items-center"
              >
                <Download className="mr-2" size={18} />
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Printer className="mr-2" size={18} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className={`mb-6 rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Report Type</h2>
            <button
              onClick={fetchReport}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center"
            >
              <RefreshCw className="mr-2" size={18} />
              Refresh
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { id: 'summary', label: 'Summary', icon: <BarChart3 size={16} /> },
              { id: 'by-product', label: 'By Product', icon: <Package size={16} /> },
              { id: 'by-customer', label: 'By Customer', icon: <Users size={16} /> },
              { id: 'by-category', label: 'By Category', icon: <PieChart size={16} /> },
              { id: 'daily', label: 'Daily', icon: <Calendar size={16} /> },
              { id: 'monthly', label: 'Monthly', icon: <FileText size={16} /> },
              { id: 'yearly', label: 'Yearly', icon: <TrendingUp size={16} /> }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setReportType(type.id)}
                className={`px-4 py-3 rounded-lg border flex flex-col items-center justify-center ${
                  reportType === type.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <span className="mb-2">{type.icon}</span>
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range & Filters */}
        <div className={`mb-6 rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Payment Status</label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => setFilters({...filters, paymentStatus: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Status</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={fetchReport}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Generate Report
              </button>
            </div>
          </div>
          
          {reportData && (
            <div className="mt-4 pt-4 border-t border-gray-700 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Report Period: {new Date(dateRange.startDate).toLocaleDateString()} to {new Date(dateRange.endDate).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Generating sales report...</p>
          </div>
        ) : reportData ? (
          <>
            {/* Report Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Sales
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBDT(reportData.summary?.totalSales || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <DollarSign size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {reportData.summary?.totalInvoices || 0} invoices
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Profit
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBDT(reportData.summary?.totalProfit || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {reportData.summary?.profitMargin ? `${reportData.summary.profitMargin}%` : 'N/A'}
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Due
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatBDT(reportData.summary?.totalDue || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-600">
                    <TrendingDown size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {reportData.summary?.dueInvoices || 0} pending
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Customers
                    </p>
                    <p className="text-2xl font-bold">
                      {reportData.summary?.totalCustomers || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600">
                    <Users size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Active customers
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className={`rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              {renderReport()}
            </div>

            {/* Additional Insights */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <TrendingUp className="mr-2" />
                  Sales Performance
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Sale Value</p>
                    <p className="text-xl font-bold">
                      {formatBDT(
                        reportData.summary?.totalSales && reportData.summary?.totalInvoices
                          ? reportData.summary.totalSales / reportData.summary.totalInvoices
                          : 0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Collection Rate</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${reportData.summary?.collectionRate || 0}%`,
                            maxWidth: '100%'
                          }}
                        ></div>
                      </div>
                      <span className="text-sm">
                        {reportData.summary?.collectionRate || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <PieChart className="mr-2" />
                  Sales Distribution
                </h3>
                <div className="flex items-center justify-center h-40">
                  {/* Simple pie chart representation */}
                  <div className="relative w-32 h-32">
                    {reportData.distribution && Object.entries(reportData.distribution).map(([category, value], index) => {
                      const colors = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'];
                      const percentage = (value / reportData.summary?.totalSales * 100) || 0;
                      return (
                        <div
                          key={category}
                          className="absolute inset-0 rounded-full border-8"
                          style={{
                            borderColor: colors[index % colors.length],
                            clipPath: `conic-gradient(transparent 0deg, transparent ${index * 20}deg, ${colors[index % colors.length]} 0deg)`
                          }}
                        ></div>
                      );
                    })}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {Object.keys(reportData.distribution || {}).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Categories</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`rounded-xl p-12 text-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Sales Report</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Select a report type and date range to generate the report
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-components for different report types
const SalesSummaryReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Sales Summary Report</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Date Range</th>
            <th className="text-left py-3 px-6">Total Sales</th>
            <th className="text-left py-3 px-6">Total Profit</th>
            <th className="text-left py-3 px-6">Total Due</th>
            <th className="text-left py-3 px-6">Invoices</th>
            <th className="text-left py-3 px-6">Customers</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
            <td className="py-3 px-6">{data.period}</td>
            <td className="py-3 px-6">
              <span className="font-bold text-green-600">{formatBDT(data.summary?.totalSales || 0)}</span>
            </td>
            <td className="py-3 px-6">
              <span className="font-bold text-green-600">{formatBDT(data.summary?.totalProfit || 0)}</span>
            </td>
            <td className="py-3 px-6">
              <span className="font-bold text-red-600">{formatBDT(data.summary?.totalDue || 0)}</span>
            </td>
            <td className="py-3 px-6">{data.summary?.totalInvoices || 0}</td>
            <td className="py-3 px-6">{data.summary?.totalCustomers || 0}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    {data.topProducts && data.topProducts.length > 0 && (
      <div className="mt-8">
        <h4 className="text-lg font-bold mb-4">Top Products</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.topProducts.slice(0, 3).map((product, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{product.name}</span>
                <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-600">
                  #{index + 1}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sales: {formatBDT(product.sales)} • Qty: {product.quantity}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const SalesByProductReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Sales By Product</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Product</th>
            <th className="text-left py-3 px-6">Category</th>
            <th className="text-left py-3 px-6">Quantity Sold</th>
            <th className="text-left py-3 px-6">Sales Amount</th>
            <th className="text-left py-3 px-6">Profit</th>
            <th className="text-left py-3 px-6">% of Total</th>
          </tr>
        </thead>
        <tbody>
          {data.products?.map((product, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{product.code}</p>
                </div>
              </td>
              <td className="py-3 px-6">
                <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">
                  {product.category}
                </span>
              </td>
              <td className="py-3 px-6">{product.quantity}</td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(product.salesAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(product.profit)}</span>
              </td>
              <td className="py-3 px-6">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${product.percentage || 0}%`,
                        maxWidth: '100%'
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">{product.percentage || 0}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SalesByCustomerReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Sales By Customer</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Customer</th>
            <th className="text-left py-3 px-6">Invoices</th>
            <th className="text-left py-3 px-6">Total Sales</th>
            <th className="text-left py-3 px-6">Paid</th>
            <th className="text-left py-3 px-6">Due</th>
            <th className="text-left py-3 px-6">Last Purchase</th>
          </tr>
        </thead>
        <tbody>
          {data.customers?.map((customer, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{customer.company}</p>
                </div>
              </td>
              <td className="py-3 px-6">{customer.invoiceCount}</td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(customer.totalSales)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(customer.paidAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className={`font-bold ${customer.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatBDT(customer.dueAmount)}
                </span>
              </td>
              <td className="py-3 px-6">
                {customer.lastPurchase ? new Date(customer.lastPurchase).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SalesByCategoryReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Sales By Category</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Category</th>
            <th className="text-left py-3 px-6">Products</th>
            <th className="text-left py-3 px-6">Sales Amount</th>
            <th className="text-left py-3 px-6">% of Total</th>
            <th className="text-left py-3 px-6">Trend</th>
          </tr>
        </thead>
        <tbody>
          {data.categories?.map((category, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="font-medium">{category.name}</span>
                </div>
              </td>
              <td className="py-3 px-6">{category.productCount}</td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(category.salesAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${category.percentage || 0}%`,
                        maxWidth: '100%'
                      }}
                    ></div>
                  </div>
                  <span className="text-sm">{category.percentage || 0}%</span>
                </div>
              </td>
              <td className="py-3 px-6">
                <span className={`flex items-center ${category.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {category.trend > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="ml-1">{Math.abs(category.trend)}%</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const DailySalesReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Daily Sales Report</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Date</th>
            <th className="text-left py-3 px-6">Invoices</th>
            <th className="text-left py-3 px-6">Sales Amount</th>
            <th className="text-left py-3 px-6">Profit</th>
            <th className="text-left py-3 px-6">Collections</th>
            <th className="text-left py-3 px-6">Day</th>
          </tr>
        </thead>
        <tbody>
          {data.dailySales?.map((day, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">{day.date}</td>
              <td className="py-3 px-6">{day.invoiceCount}</td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(day.salesAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(day.profit)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-blue-600">{formatBDT(day.collections)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">
                  {day.dayName}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const MonthlySalesReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Monthly Sales Report</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Month</th>
            <th className="text-left py-3 px-6">Invoices</th>
            <th className="text-left py-3 px-6">Sales Amount</th>
            <th className="text-left py-3 px-6">Profit</th>
            <th className="text-left py-3 px-6">Growth</th>
            <th className="text-left py-3 px-6">Avg. Sale</th>
          </tr>
        </thead>
        <tbody>
          {data.monthlySales?.map((month, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                <span className="font-medium">{month.month}</span>
                <p className="text-sm text-gray-600 dark:text-gray-400">{month.year}</p>
              </td>
              <td className="py-3 px-6">{month.invoiceCount}</td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(month.salesAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(month.profit)}</span>
              </td>
              <td className="py-3 px-6">
                <span className={`font-bold ${month.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {month.growth > 0 ? '+' : ''}{month.growth}%
                </span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold">{formatBDT(month.averageSale)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const YearlySalesReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Yearly Sales Report</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Year</th>
            <th className="text-left py-3 px-6">Invoices</th>
            <th className="text-left py-3 px-6">Sales Amount</th>
            <th className="text-left py-3 px-6">Profit</th>
            <th className="text-left py-3 px-6">Growth</th>
            <th className="text-left py-3 px-6">Customers</th>
          </tr>
        </thead>
        <tbody>
          {data.yearlySales?.map((year, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                <span className="font-bold text-xl">{year.year}</span>
              </td>
              <td className="py-3 px-6">{year.invoiceCount}</td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(year.salesAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(year.profit)}</span>
              </td>
              <td className="py-3 px-6">
                <span className={`font-bold ${year.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {year.growth > 0 ? '+' : ''}{year.growth}%
                </span>
              </td>
              <td className="py-3 px-6">{year.customerCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default ReportsSales;