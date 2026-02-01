import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { salesAPI } from '../../services/api';
import {
  Search, Filter, Download, Printer, Eye,
  DollarSign, Calendar, ChevronLeft, ChevronRight, Plus,
  FileText, CheckCircle, Clock, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';
import { formatDate } from '../../utils/bengaliDate';

const LOCAL_SALES_KEY = 'tanisha_sales_cache_v1';

const unwrap = (res) => {
  if (!res) return { ok: false, data: null, error: 'No response' };
  if (typeof res.success === 'boolean') return { ok: res.success, data: res.data, error: res.error };
  if (res.data && typeof res.data.success === 'boolean') return { ok: res.data.success, data: res.data.data, error: res.data.error };
  return { ok: false, data: null, error: 'Unexpected response shape' };
};

const SalesList = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1
  });

  const [summary, setSummary] = useState({
    totalSales: 0,
    totalPaid: 0,
    totalDue: 0
  });

  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    customerId: '',
    status: ''
  });

  const [showFilter, setShowFilter] = useState(false);
  const [customers, setCustomers] = useState([]);

  const loadLocalSales = () => {
    try {
      const raw = localStorage.getItem(LOCAL_SALES_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await salesAPI.getCustomers?.({ limit: 100 });
      if (!res) return;
      const u = unwrap(res);
      if (u.ok) {
        const list = Array.isArray(u.data) ? u.data : (u.data?.customers || []);
        setCustomers(list);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const computeSummary = (list) => {
    const totalSales = list.reduce((s, x) => s + Number(x.totalAmount || 0), 0);
    const totalPaid = list.reduce((s, x) => s + Number(x.paidAmount || 0), 0);
    const totalDue = list.reduce((s, x) => s + Number(x.dueAmount || 0), 0);
    return { totalSales, totalPaid, totalDue };
  };

  const fetchSales = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };

      Object.keys(params).forEach((key) => {
        if (params[key] === '' || params[key] === null) delete params[key];
      });

      if (!salesAPI.getSalesList) {
        const local = loadLocalSales();
        setSales(local);
        setSummary(computeSummary(local));
        setPagination((p) => ({ ...p, page: 1, total: local.length, totalPages: 1 }));
        setLoading(false);
        return;
      }

      const res = await salesAPI.getSalesList(params);
      const u = unwrap(res);

      if (!u.ok) {
        toast.error(u.error || 'Failed to load sales data');
        const local = loadLocalSales();
        setSales(local);
        setSummary(computeSummary(local));
        setPagination((p) => ({ ...p, page: 1, total: local.length, totalPages: 1 }));
        return;
      }

      // allow a few shapes:
      // { sales, pagination, summary } OR { rows, pagination } etc.
      const data = u.data || {};
      const list = data.sales || data.rows || data.items || [];
      setSales(list);

      const pag = data.pagination || {
        page,
        limit: pagination.limit,
        total: list.length,
        totalPages: 1
      };
      setPagination(pag);

      setSummary(data.summary || computeSummary(list));
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast.error('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(1);
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) fetchSales(newPage);
  };

  const handleFilterChange = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const handleApplyFilters = () => {
    setShowFilter(false);
    fetchSales(1);
  };

  const handleResetFilters = () => {
    setFilters({ search: '', startDate: '', endDate: '', customerId: '', status: '' });
    fetchSales(1);
  };

  const handleExport = async (format) => {
    toast.info(`Exporting ${format.toUpperCase()} (UI only)`);
  };

  const getStatusBadge = (status, paymentStatus) => {
    if (status === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-200">
          <XCircle className="inline mr-1" size={12} />
          Cancelled
        </span>
      );
    }

    if (paymentStatus === 'paid' || Number(status) === 1) {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-200">
          <CheckCircle className="inline mr-1" size={12} />
          Paid
        </span>
      );
    }

    if (paymentStatus === 'partial') {
      return (
        <span className="px-3 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-200">
          <Clock className="inline mr-1" size={12} />
          Partial
        </span>
      );
    }

    return (
      <span className="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-200">
        <Clock className="inline mr-1" size={12} />
        Unpaid
      </span>
    );
  };

  const pageButtons = useMemo(() => {
    const max = Math.min(5, pagination.totalPages);
    return Array.from({ length: max }, (_, i) => i + 1);
  }, [pagination.totalPages]);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <FileText className="mr-3" />
                Sales List (বিক্রয় তালিকা)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - All Sales & Invoices
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/sales/create')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
              >
                <Plus className="mr-2" size={18} />
                New Sale
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Sales Value</p>
                <p className="text-2xl font-bold text-blue-600">{formatBDT(summary.totalSales)}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600">
                <DollarSign size={24} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Received</p>
                <p className="text-2xl font-bold text-green-600">{formatBDT(summary.totalPaid)}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Due</p>
                <p className="text-2xl font-bold text-red-600">{formatBDT(summary.totalDue)}</p>
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
                  placeholder="Search by invoice number, customer name or phone..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilter(!showFilter)}
                className={`px-4 py-2 rounded-lg flex items-center ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Filter className="mr-2" size={18} />
                Filters
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 flex items-center"
                >
                  <Printer className="mr-2" size={18} />
                  PDF
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="px-4 py-2 rounded-lg bg-green-500/20 text-green-200 hover:bg-green-500/30 flex items-center"
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
            <div className={`mt-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Customer</label>
                  <select
                    value={filters.customerId}
                    onChange={(e) => handleFilterChange('customerId', e.target.value)}
                    className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">All Customers</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex items-end space-x-2">
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

        {/* Sales Table */}
        <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4">Loading sales data...</p>
            </div>
          ) : sales.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="text-left py-3 px-6 font-medium">Invoice #</th>
                      <th className="text-left py-3 px-6 font-medium">Customer</th>
                      <th className="text-left py-3 px-6 font-medium">Date</th>
                      <th className="text-left py-3 px-6 font-medium">Amount</th>
                      <th className="text-left py-3 px-6 font-medium">Paid/Due</th>
                      <th className="text-left py-3 px-6 font-medium">Status</th>
                      <th className="text-left py-3 px-6 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className={`border-b ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'}`}
                      >
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-bold">{sale.invoiceNumber || sale.invoiceNo || `INV-${sale.id}`}</p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>ID: {sale.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-medium">{sale.customerName || sale.customer?.name || '—'}</p>
                            <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {sale.customerPhone || sale.customer?.phone || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center">
                            <Calendar className="mr-2 text-gray-500" size={14} />
                            <span>{formatDate(sale.invoiceDate || sale.createdAt || sale.date)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <p className="font-bold">{formatBDT(sale.totalAmount || 0)}</p>
                        </td>
                        <td className="py-3 px-6">
                          <div>
                            <p className="text-green-600">Paid: {formatBDT(sale.paidAmount || 0)}</p>
                            <p className={`text-sm ${(sale.dueAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Due: {formatBDT(sale.dueAmount || 0)}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-6">{getStatusBadge(sale.status, sale.paymentStatus)}</td>
                        <td className="py-3 px-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => navigate(`/sales/view/${sale.id}`)}
                              className="p-2 text-blue-600 hover:text-blue-500"
                              title="View Details"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => window.print()}
                              className="p-2 text-green-600 hover:text-green-500"
                              title="Print Invoice"
                            >
                              <Printer size={18} />
                            </button>
                            {(sale.dueAmount || 0) > 0 && (
                              <button
                                onClick={() => navigate(`/sales/payment/${sale.id}`)}
                                className="p-2 text-purple-600 hover:text-purple-500"
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
              <div className={`px-6 py-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                      Showing {sales.length} of {pagination.total} sales
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-50' : 'bg-gray-100 hover:bg-gray-200 disabled:opacity-50'}`}
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center space-x-1">
                      {pageButtons.map((pageNum) => (
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
                      ))}

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
                      className={`p-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 disabled:opacity-50' : 'bg-gray-100 hover:bg-gray-200 disabled:opacity-50'}`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span>Items per page:</span>
                    <select
                      value={pagination.limit}
                      onChange={(e) => {
                        const lim = parseInt(e.target.value, 10);
                        setPagination((prev) => ({ ...prev, limit: lim }));
                        fetchSales(1);
                      }}
                      className={`px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
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
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Sales Found</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {(filters.search || filters.startDate || filters.customerId || filters.status)
                  ? 'Try changing your filters'
                  : 'Create your first sale to get started'}
              </p>
              {!(filters.search || filters.startDate || filters.customerId || filters.status) && (
                <button
                  onClick={() => navigate('/sales/create')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Create First Sale
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={`mt-6 p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="font-bold mb-4">Sales Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Invoices</p>
              <p className="text-2xl font-bold">{pagination.total}</p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Average Sale</p>
              <p className="text-2xl font-bold">
                {pagination.total > 0 ? formatBDT(summary.totalSales / pagination.total) : '৳ 0'}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Collection Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.totalSales > 0 ? `${((summary.totalPaid / summary.totalSales) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
            <div className="text-center">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Due Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.totalSales > 0 ? `${((summary.totalDue / summary.totalSales) * 100).toFixed(1)}%` : '0%'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesList;
