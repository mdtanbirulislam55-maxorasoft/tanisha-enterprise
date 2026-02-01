import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { purchaseAPI } from '../../services/api';
import {
  Search, Filter, Download, Printer, Eye,
  Truck, Calendar, Building, Package,
  ChevronLeft, ChevronRight, Plus,
  FileText, CheckCircle, Clock, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';
import { formatDate } from '../../utils/bengaliDate';

const PurchaseList = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });
  
  const [summary, setSummary] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    totalDue: 0
  });
  
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    supplierId: '',
    status: '',
    warehouseId: ''
  });
  
  const [showFilter, setShowFilter] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
    fetchWarehouses();
  }, []);

  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await purchaseAPI.getPurchasesList(params);
      
      if (response.success) {
        setPurchases(response.data.purchases);
        setPagination(response.data.pagination);
        setSummary(response.data.summary);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await purchaseAPI.getSuppliers({ limit: 100 });
      if (response.success) {
        setSuppliers(response.data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await purchaseAPI.getWarehouses();
      if (response.success) {
        setWarehouses(response.data);
      }
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchPurchases(newPage);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setShowFilter(false);
    fetchPurchases(1);
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      startDate: '',
      endDate: '',
      supplierId: '',
      status: '',
      warehouseId: ''
    });
    fetchPurchases(1);
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (status === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-700">
          <XCircle className="inline mr-1" size={12} />
          Cancelled
        </span>
      );
    }
    
    if (status === 'received') {
      if (paymentStatus === 'paid') {
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-700">
            <CheckCircle className="inline mr-1" size={12} />
            Received & Paid
          </span>
        );
      }
      if (paymentStatus === 'partial') {
        return (
          <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-700">
            <Clock className="inline mr-1" size={12} />
            Received & Partial
          </span>
        );
      }
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-blue-500/20 text-blue-700">
          <CheckCircle className="inline mr-1" size={12} />
          Received
        </span>
      );
    }
    
    if (status === 'partial') {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-purple-500/20 text-purple-700">
          <Clock className="inline mr-1" size={12} />
          Partial
        </span>
      );
    }
    
    return (
      <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-700">
        <Clock className="inline mr-1" size={12} />
        Pending
      </span>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Truck className="mr-3" />
                Purchase Orders (ক্রয় অর্ডার)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - All Purchase Orders
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/purchase/create')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
              >
                <Plus className="mr-2" size={18} />
                New Purchase
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Purchase Value
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatBDT(summary.totalPurchases)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                <Truck size={24} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Paid
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatBDT(summary.totalPaid)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Due
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {formatBDT(summary.totalDue)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/20 text-red-600">
                <Clock size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={`mb-6 rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by PO number, supplier, or reference..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                <Filter className="mr-2" size={18} />
                Filters
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {}}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-700 hover:bg-red-500/30 flex items-center"
                >
                  <Printer className="mr-2" size={18} />
                  PDF
                </button>
                <button
                  onClick={() => {}}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-700 hover:bg-green-500/30 flex items-center"
                >
                  <Download className="mr-2" size={18} />
                  CSV
                </button>
              </div>
              
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Search
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilter && (
            <div className={`mt-4 p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
            }`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className={`w-full px-3 py-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className={`w-full px-3 py-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier</label>
                  <select
                    value={filters.supplierId}
                    onChange={(e) => handleFilterChange('supplierId', e.target.value)}
                    className={`w-full px-3 py-2 rounded border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name} ({supplier.company})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={`w-full px-3 py-2 rounded border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="received">Received</option>
                    <option value="partial">Partial</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Warehouse</label>
                  <select
                    value={filters.warehouseId}
                    onChange={(e) => handleFilterChange('warehouseId', e.target.value)}
                    className={`w-full px-3 py-2 rounded border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">All Warehouses</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-3 flex items-end space-x-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex-1"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg flex-1"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Purchase Table */}
        <div className={`rounded-xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4">Loading purchase data...</p>
            </div>
          ) : purchases.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className="text-left py-3 px-6 font-medium">PO #</th>
                      <th className="text-left py-3 px-6 font-medium">Supplier</th>
                      <th className="text-left py-3 px-6 font-medium">Date</th>
                      <th className="text-left py-3 px-6 font-medium">Amount</th>
                      <th className="text-left py-3 px-6 font-medium">Paid/Due</th>
                      <th className="text-left py-3 px-6 font-medium">Status</th>
                      <th className="text-left py-3 px-6 font-medium">Warehouse</th>
                      <th className="text-left py-3 px-6 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((purchase) => (
                      <tr 
                        key={purchase.id}
                        className={`border-b ${
                          theme === 'dark' 
                            ? 'border-gray-700 hover:bg-gray-750' 
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-bold">{purchase.purchaseNumber}</p>
                            {purchase.referenceNo && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                Ref: {purchase.referenceNo}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-medium">{purchase.supplierName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {purchase.supplier?.company}
                            </p>
                            <p className="text-xs">{purchase.supplierPhone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center">
                            <Calendar className="mr-2 text-gray-500" size={14} />
                            <span>{formatDate(purchase.purchaseDate)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <p className="font-bold">{formatBDT(purchase.totalAmount)}</p>
                        </td>
                        <td className="py-3 px-6">
                          <div>
                            <p className="text-green-600">
                              Paid: {formatBDT(purchase.paidAmount)}
                            </p>
                            <p className={`text-sm ${purchase.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Due: {formatBDT(purchase.dueAmount)}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          {getStatusBadge(purchase.status, purchase.paymentStatus)}
                        </td>
                        <td className="py-3 px-6">
                          <p className="text-sm">{purchase.warehouse?.name || 'Main'}</p>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/purchase/view/${purchase.id}`)}
                              className="p-2 text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            {purchase.status === 'pending' && (
                              <button
                                onClick={() => navigate(`/purchase/receive/${purchase.id}`)}
                                className="p-2 text-green-600 hover:text-green-800"
                                title="Receive Stock"
                              >
                                <Truck size={18} />
                              </button>
                            )}
                            {purchase.dueAmount > 0 && (
                              <button
                                onClick={() => navigate(`/purchase/payment/${purchase.id}`)}
                                className="p-2 text-purple-600 hover:text-purple-800"
                                title="Add Payment"
                              >
                                <DollarSign size={18} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className={`px-6 py-4 border-t ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Showing {purchases.length} of {pagination.total} purchases
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`p-2 rounded ${
                        theme === 'dark' 
                          ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-50' 
                          : 'bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                      }`}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded ${
                              pagination.page === pageNum
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {pagination.totalPages > 5 && (
                        <>
                          <span className="px-2">...</span>
                          <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className={`w-8 h-8 rounded ${
                              pagination.page === pagination.totalPages
                                ? 'bg-blue-600 text-white'
                                : theme === 'dark'
                                ? 'bg-gray-700 hover:bg-gray-600'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                          >
                            {pagination.totalPages}
                          </button>
                        </>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`p-2 rounded ${
                        theme === 'dark' 
                          ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-50' 
                          : 'bg-gray-100 hover:bg-gray-200 disabled:opacity-50'
                      }`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <span>Items per page:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => {
                        setPagination(prev => ({ ...prev, limit: parseInt(e.target.value) }));
                        fetchPurchases(1);
                      }}
                      className={`px-2 py-1 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center">
              <Truck className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Purchase Orders Found</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {filters.search || filters.startDate || filters.supplierId || filters.status
                  ? 'Try changing your filters'
                  : 'Create your first purchase order to get started'}
              </p>
              {!(filters.search || filters.startDate || filters.supplierId || filters.status) && (
                <button
                  onClick={() => navigate('/purchase/create')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  Create First Purchase
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={`mt-6 p-6 rounded-xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="font-bold mb-4">Purchase Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Orders
              </p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Average Order
              </p>
              <p className="text-2xl font-bold">
                {pagination.total > 0 ? formatBDT(summary.totalPurchases / pagination.total) : '৳ 0'}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment Rate
              </p>
              <p className="text-2xl font-bold text-green-600">
                {summary.totalPurchases > 0 
                  ? `${((summary.totalPaid / summary.totalPurchases) * 100).toFixed(1)}%` 
                  : '0%'}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Due Rate
              </p>
              <p className="text-2xl font-bold text-red-600">
                {summary.totalPurchases > 0 
                  ? `${((summary.totalDue / summary.totalPurchases) * 100).toFixed(1)}%` 
                  : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseList;