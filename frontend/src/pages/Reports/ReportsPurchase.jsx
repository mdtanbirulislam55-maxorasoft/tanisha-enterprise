import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { reportsAPI } from '../../services/api';
import {
  ShoppingBag, Download, Printer, Filter,
  Calendar, TrendingUp, TrendingDown,
  DollarSign, Truck, Package, PieChart,
  Search, RefreshCw, Eye, FileText,
  CheckCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const ReportsPurchase = () => {
  const { theme } = useTheme();
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  const [filters, setFilters] = useState({
    supplierId: '',
    productId: '',
    category: '',
    paymentStatus: '',
    status: ''
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
          response = await reportsAPI.getPurchaseSummary(params);
          break;
        case 'by-product':
          response = await reportsAPI.getPurchaseByProduct(params);
          break;
        case 'by-supplier':
          response = await reportsAPI.getPurchaseBySupplier(params);
          break;
        case 'pending':
          response = await reportsAPI.getPendingPurchases(params);
          break;
        case 'payment':
          response = await reportsAPI.getPurchasePaymentReport(params);
          break;
        default:
          response = await reportsAPI.getPurchaseSummary(params);
      }

      if (response.success) {
        setReportData(response.data);
      }
    } catch (error) {
      toast.error('Failed to load purchase report');
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
        return <PurchaseSummaryReport data={reportData} />;
      case 'by-product':
        return <PurchaseByProductReport data={reportData} />;
      case 'by-supplier':
        return <PurchaseBySupplierReport data={reportData} />;
      case 'pending':
        return <PendingPurchasesReport data={reportData} />;
      case 'payment':
        return <PurchasePaymentReport data={reportData} />;
      default:
        return <PurchaseSummaryReport data={reportData} />;
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
                <ShoppingBag className="mr-3" />
                Purchase Reports (ক্রয় রিপোর্ট)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Purchase Analysis & Insights
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { id: 'summary', label: 'Summary', icon: <ShoppingBag size={16} /> },
              { id: 'by-product', label: 'By Product', icon: <Package size={16} /> },
              { id: 'by-supplier', label: 'By Supplier', icon: <Truck size={16} /> },
              { id: 'pending', label: 'Pending', icon: <Clock size={16} /> },
              { id: 'payment', label: 'Payment', icon: <DollarSign size={16} /> }
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
            
            <div>
              <label className="block text-sm font-medium mb-1">Order Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className={`w-full px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchReport}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Generate Report
            </button>
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
            <p className="mt-4">Generating purchase report...</p>
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
                      Total Purchases
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatBDT(reportData.summary?.totalPurchases || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600">
                    <ShoppingBag size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {reportData.summary?.totalOrders || 0} orders
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
                  {reportData.summary?.dueOrders || 0} pending
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Paid
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBDT(reportData.summary?.totalPaid || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <DollarSign size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {reportData.summary?.paidOrders || 0} completed
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Suppliers
                    </p>
                    <p className="text-2xl font-bold">
                      {reportData.summary?.totalSuppliers || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-500/20 text-purple-600">
                    <Truck size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Active suppliers
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
                  Purchase Performance
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Purchase Value</p>
                    <p className="text-xl font-bold">
                      {formatBDT(
                        reportData.summary?.totalPurchases && reportData.summary?.totalOrders
                          ? reportData.summary.totalPurchases / reportData.summary.totalOrders
                          : 0
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Payment Completion Rate</p>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${reportData.summary?.paymentRate || 0}%`,
                            maxWidth: '100%'
                          }}
                        ></div>
                      </div>
                      <span className="text-sm">
                        {reportData.summary?.paymentRate || 0}%
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
                  Supplier Distribution
                </h3>
                <div className="flex items-center justify-center h-40">
                  {/* Simple pie chart representation */}
                  <div className="relative w-32 h-32">
                    {reportData.supplierDistribution && Object.entries(reportData.supplierDistribution).slice(0, 5).map(([supplier, value], index) => {
                      const colors = ['#10B981', '#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6'];
                      const percentage = (value / reportData.summary?.totalPurchases * 100) || 0;
                      return (
                        <div
                          key={supplier}
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
                          {Object.keys(reportData.supplierDistribution || {}).length}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Suppliers</div>
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
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Purchase Report</h3>
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
const PurchaseSummaryReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Purchase Summary Report</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Period</th>
            <th className="text-left py-3 px-6">Total Purchases</th>
            <th className="text-left py-3 px-6">Total Paid</th>
            <th className="text-left py-3 px-6">Total Due</th>
            <th className="text-left py-3 px-6">Orders</th>
            <th className="text-left py-3 px-6">Suppliers</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
            <td className="py-3 px-6">{data.period}</td>
            <td className="py-3 px-6">
              <span className="font-bold text-blue-600">{formatBDT(data.summary?.totalPurchases || 0)}</span>
            </td>
            <td className="py-3 px-6">
              <span className="font-bold text-green-600">{formatBDT(data.summary?.totalPaid || 0)}</span>
            </td>
            <td className="py-3 px-6">
              <span className="font-bold text-red-600">{formatBDT(data.summary?.totalDue || 0)}</span>
            </td>
            <td className="py-3 px-6">{data.summary?.totalOrders || 0}</td>
            <td className="py-3 px-6">{data.summary?.totalSuppliers || 0}</td>
          </tr>
        </tbody>
      </table>
    </div>
    
    {data.topSuppliers && data.topSuppliers.length > 0 && (
      <div className="mt-8">
        <h4 className="text-lg font-bold mb-4">Top Suppliers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.topSuppliers.slice(0, 3).map((supplier, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{supplier.name}</span>
                <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-600">
                  #{index + 1}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Purchases: {formatBDT(supplier.totalPurchases)} • Orders: {supplier.orderCount}
              </div>
              <div className="mt-2 text-sm">
                <span className={`${supplier.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Due: {formatBDT(supplier.dueAmount)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const PurchaseByProductReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Purchases By Product</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Product</th>
            <th className="text-left py-3 px-6">Category</th>
            <th className="text-left py-3 px-6">Quantity Purchased</th>
            <th className="text-left py-3 px-6">Purchase Amount</th>
            <th className="text-left py-3 px-6">Avg. Cost</th>
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
                <span className="font-bold text-blue-600">{formatBDT(product.purchaseAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold">{formatBDT(product.averageCost)}</span>
              </td>
              <td className="py-3 px-6">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
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

const PurchaseBySupplierReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Purchases By Supplier</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Supplier</th>
            <th className="text-left py-3 px-6">Contact</th>
            <th className="text-left py-3 px-6">Orders</th>
            <th className="text-left py-3 px-6">Total Purchases</th>
            <th className="text-left py-3 px-6">Paid</th>
            <th className="text-left py-3 px-6">Due</th>
            <th className="text-left py-3 px-6">Last Order</th>
          </tr>
        </thead>
        <tbody>
          {data.suppliers?.map((supplier, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                <div>
                  <p className="font-medium">{supplier.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{supplier.company}</p>
                </div>
              </td>
              <td className="py-3 px-6">
                <div>
                  <p className="text-sm">{supplier.phone}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{supplier.email}</p>
                </div>
              </td>
              <td className="py-3 px-6">{supplier.orderCount}</td>
              <td className="py-3 px-6">
                <span className="font-bold text-blue-600">{formatBDT(supplier.totalPurchases)}</span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(supplier.paidAmount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className={`font-bold ${supplier.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatBDT(supplier.dueAmount)}
                </span>
              </td>
              <td className="py-3 px-6">
                {supplier.lastOrder ? new Date(supplier.lastOrder).toLocaleDateString() : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PendingPurchasesReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Pending Purchase Orders</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">PO Number</th>
            <th className="text-left py-3 px-6">Supplier</th>
            <th className="text-left py-3 px-6">Order Date</th>
            <th className="text-left py-3 px-6">Expected Date</th>
            <th className="text-left py-3 px-6">Amount</th>
            <th className="text-left py-3 px-6">Status</th>
            <th className="text-left py-3 px-6">Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.pendingOrders?.map((order, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                <p className="font-bold">{order.poNumber}</p>
              </td>
              <td className="py-3 px-6">
                <p className="font-medium">{order.supplierName}</p>
              </td>
              <td className="py-3 px-6">
                {new Date(order.orderDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-6">
                {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-blue-600">{formatBDT(order.amount)}</span>
              </td>
              <td className="py-3 px-6">
                <span className={`px-2 py-1 rounded text-xs ${
                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                  order.status === 'ordered' ? 'bg-blue-500/20 text-blue-600' :
                  'bg-gray-500/20 text-gray-600'
                }`}>
                  {order.status}
                </span>
              </td>
              <td className="py-3 px-6">
                <div className="flex items-center space-x-2">
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                    <Eye size={16} />
                  </button>
                  <button className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded text-green-600">
                    <CheckCircle size={16} />
                  </button>
                  <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600">
                    <XCircle size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {data.pendingOrders?.length === 0 && (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <p className="text-gray-600 dark:text-gray-400">No pending purchase orders</p>
      </div>
    )}
  </div>
);

const PurchasePaymentReport = ({ data }) => (
  <div>
    <h3 className="text-xl font-bold mb-6">Purchase Payment Report</h3>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 dark:border-gray-600">
            <th className="text-left py-3 px-6">Payment Date</th>
            <th className="text-left py-3 px-6">Supplier</th>
            <th className="text-left py-3 px-6">PO Number</th>
            <th className="text-left py-3 px-6">Payment Method</th>
            <th className="text-left py-3 px-6">Amount</th>
            <th className="text-left py-3 px-6">Reference</th>
            <th className="text-left py-3 px-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.payments?.map((payment, index) => (
            <tr key={index} className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750">
              <td className="py-3 px-6">
                {new Date(payment.paymentDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-6">
                <p className="font-medium">{payment.supplierName}</p>
              </td>
              <td className="py-3 px-6">
                <p className="font-bold">{payment.poNumber}</p>
              </td>
              <td className="py-3 px-6">
                <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">
                  {payment.paymentMethod}
                </span>
              </td>
              <td className="py-3 px-6">
                <span className="font-bold text-green-600">{formatBDT(payment.amount)}</span>
              </td>
              <td className="py-3 px-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">{payment.reference}</p>
              </td>
              <td className="py-3 px-6">
                <span className={`px-2 py-1 rounded text-xs ${
                  payment.status === 'completed' ? 'bg-green-500/20 text-green-600' :
                  payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                  'bg-red-500/20 text-red-600'
                }`}>
                  {payment.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    
    {data.paymentSummary && (
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Payments</p>
          <p className="text-2xl font-bold text-green-600">
            {formatBDT(data.paymentSummary.totalPayments || 0)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
          <p className="text-sm text-gray-600 dark:text-gray-400">Payment Methods</p>
          <p className="text-2xl font-bold">{data.paymentSummary.paymentMethods || 0}</p>
        </div>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
          <p className="text-sm text-gray-600 dark:text-gray-400">Average Payment</p>
          <p className="text-2xl font-bold">
            {formatBDT(data.paymentSummary.averagePayment || 0)}
          </p>
        </div>
      </div>
    )}
  </div>
);

// Missing Clock icon component
const Clock = ({ size = 16 }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export default ReportsPurchase;