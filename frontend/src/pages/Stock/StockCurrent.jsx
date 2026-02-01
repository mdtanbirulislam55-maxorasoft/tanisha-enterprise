import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { productAPI } from '../../services/api';
import { Package, Search, Download, Printer, AlertTriangle, TrendingUp, RefreshCw, Eye, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const StockCurrent = () => {
  const { theme } = useTheme();

  const [products, setProducts] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => set.add(p.category || 'Uncategorized'));
    return Array.from(set).sort().map((name, idx) => ({ id: idx + 1, name }));
  }, [products]);

  useEffect(() => {
    fetchStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterStock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, search, categoryFilter, lowStockFilter]);

  const mapProductToStockRow = (p) => {
    const quantity = Number(p.stockQuantity ?? 0);
    const alertQuantity = Number(p.lowStockThreshold ?? 5);
    const reorderLevel = Number(p.lowStockThreshold ?? 5) + 5;

    return {
      id: p.id,
      productName: p.name || 'Unnamed Product',
      productCode: p.sku || p.code || String(p.id),
      category: p.category || 'Uncategorized',
      quantity,
      alertQuantity,
      reorderLevel,
      unit: p.unit || 'pcs',
      costPrice: Number(p.costPrice ?? 0),
      sellingPrice: Number(p.sellingPrice ?? 0),
    };
  };

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll();
      if (res?.data?.success) {
        const rows = (res.data.data || []).map(mapProductToStockRow);
        setProducts(rows);
      } else {
        setProducts([]);
        toast.error(res?.data?.error || 'Failed to load products');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load stock data (products)');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filterStock = () => {
    let filtered = [...products];

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          String(item.productName).toLowerCase().includes(s) ||
          String(item.productCode).toLowerCase().includes(s) ||
          String(item.category).toLowerCase().includes(s)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    if (lowStockFilter) {
      filtered = filtered.filter((item) => item.quantity <= item.alertQuantity);
    }

    setFilteredStock(filtered);
  };

  const handleExport = (format) => {
    toast(`Exporting stock report as ${format.toUpperCase()} (UI only)`);
  };

  const calculateStockValue = (item) => item.quantity * item.costPrice;

  const getStockStatus = (quantity, alertQuantity, reorderLevel) => {
    if (quantity <= alertQuantity) return { color: 'text-red-600', bg: 'bg-red-500/20', text: 'Low Stock' };
    if (quantity <= reorderLevel) return { color: 'text-yellow-600', bg: 'bg-yellow-500/20', text: 'Reorder' };
    return { color: 'text-green-600', bg: 'bg-green-500/20', text: 'In Stock' };
  };

  const totals = useMemo(() => {
    return filteredStock.reduce(
      (acc, item) => {
        acc.items += 1;
        acc.quantity += Number(item.quantity || 0);
        acc.value += calculateStockValue(item);
        acc.lowStock += item.quantity <= item.alertQuantity ? 1 : 0;
        return acc;
      },
      { items: 0, quantity: 0, value: 0, lowStock: 0 }
    );
  }, [filteredStock]);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Package className="mr-3" />
                Current Stock (বর্তমান স্টক)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Stock Overview (based on Products)
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 flex items-center"
              >
                <Download className="mr-2" size={18} />
                Export
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Printer className="mr-2" size={18} />
                Print
              </button>

              <button
                onClick={fetchStock}
                className={`px-4 py-2 rounded-lg border flex items-center ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`}
              >
                <RefreshCw className="mr-2" size={18} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`mb-6 rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Search Products</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name, code or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`w-full px-4 py-2 rounded-lg border ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                }`}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Low Stock Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Stock Status</label>
              <button
                onClick={() => setLowStockFilter(!lowStockFilter)}
                className={`w-full px-4 py-2 rounded-lg border flex items-center justify-center ${
                  lowStockFilter
                    ? 'bg-red-500/20 border-red-500/30 text-red-200'
                    : theme === 'dark'
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-white border-gray-300'
                }`}
              >
                <AlertTriangle className="mr-2" size={18} />
                {lowStockFilter ? 'Showing Low Stock' : 'Show Low Stock'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-6 pt-6 border-t border-gray-700 dark:border-gray-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold">{filteredStock.length}</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
                <p className="text-2xl font-bold">{totals.quantity.toFixed(2)}</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock Value</p>
                <p className="text-2xl font-bold text-green-600">{formatBDT(totals.value)}</p>
              </div>
              <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{totals.lowStock}</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading stock data...</p>
          </div>
        ) : (
          <>
            {/* Stock Table */}
            <div
              className={`rounded-xl overflow-hidden mb-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="text-left py-3 px-6">Product</th>
                      <th className="text-left py-3 px-6">Category</th>
                      <th className="text-left py-3 px-6">Current Stock</th>
                      <th className="text-left py-3 px-6">Low Stock Threshold</th>
                      <th className="text-left py-3 px-6">Reorder Level</th>
                      <th className="text-left py-3 px-6">Stock Value</th>
                      <th className="text-left py-3 px-6">Status</th>
                      <th className="text-left py-3 px-6">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredStock.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-500">
                          No stock items found
                        </td>
                      </tr>
                    ) : (
                      filteredStock.map((item) => {
                        const status = getStockStatus(item.quantity, item.alertQuantity, item.reorderLevel);
                        const stockValue = calculateStockValue(item);

                        return (
                          <tr
                            key={item.id}
                            className={`border-b ${
                              theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-3 px-6">
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Code: {item.productCode}</p>
                              </div>
                            </td>

                            <td className="py-3 px-6">
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">
                                {item.category}
                              </span>
                            </td>

                            <td className="py-3 px-6">
                              <div>
                                <p className="font-bold">
                                  {item.quantity} {item.unit}
                                </p>
                                {item.quantity <= item.alertQuantity && (
                                  <p className="text-xs text-red-400 flex items-center">
                                    <AlertTriangle size={12} className="mr-1" />
                                    Low stock
                                  </p>
                                )}
                              </div>
                            </td>

                            <td className="py-3 px-6">
                              <span className="text-red-500 font-bold">{item.alertQuantity}</span>
                            </td>

                            <td className="py-3 px-6">
                              <span className="text-yellow-500 font-bold">{item.reorderLevel}</span>
                            </td>

                            <td className="py-3 px-6">
                              <span className="font-bold text-green-600">{formatBDT(stockValue)}</span>
                            </td>

                            <td className="py-3 px-6">
                              <span className={`px-2 py-1 rounded text-xs ${status.bg} ${status.color}`}>{status.text}</span>
                            </td>

                            <td className="py-3 px-6">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => toast('View: not implemented')}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => toast('Edit: go to Products → Edit')}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => toast('Delete: available in Products module')}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className={`rounded-xl p-6 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Total Stock Value</p>
                    <p className="text-2xl font-bold text-green-600">{formatBDT(totals.value)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {totals.items} items • {totals.quantity.toFixed(2)} total quantity
                </div>
              </div>

              <div
                className={`rounded-xl p-6 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Low Stock Alert</p>
                    <p className="text-2xl font-bold text-red-600">{totals.lowStock}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Need attention</div>
              </div>

              <div
                className={`rounded-xl p-6 ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Average Stock Level</p>
                    <p className="text-2xl font-bold">{totals.items > 0 ? (totals.quantity / totals.items).toFixed(2) : '0.00'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600">
                    <Package size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">Per product average</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockCurrent;
