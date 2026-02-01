import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { productAPI } from '../../services/api';
import { Package, Search, Plus, XCircle, RefreshCw, Save, Calculator, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const STORAGE_KEY = 'tanisha_stock_adjustments_v1';

const StockAdjustment = () => {
  const { theme } = useTheme();

  const [adjustments, setAdjustments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');

  // Form
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([
    {
      productId: '',
      productName: '',
      sku: '',
      unit: 'pcs',
      currentStock: 0,
      newStock: 0,
      costPrice: 0,
    },
  ]);

  useEffect(() => {
    loadLocalAdjustments();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLocalAdjustments = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : [];
      setAdjustments(Array.isArray(data) ? data : []);
    } catch {
      setAdjustments([]);
    }
  };

  const saveLocalAdjustments = (next) => {
    setAdjustments(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productAPI.getAll();
      if (res?.data?.success) {
        setProducts(res.data.data || []);
      } else {
        toast.error(res?.data?.error || 'Failed to load products');
        setProducts([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productId: '',
        productName: '',
        sku: '',
        unit: 'pcs',
        currentStock: 0,
        newStock: 0,
        costPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const next = [...prev];

      if (field === 'productId') {
        const p = products.find((x) => String(x.id) === String(value));
        next[index] = {
          ...next[index],
          productId: value,
          productName: p?.name || '',
          sku: p?.sku || p?.code || String(p?.id || ''),
          unit: p?.unit || 'pcs',
          currentStock: Number(p?.stockQuantity ?? 0),
          newStock: Number(p?.stockQuantity ?? 0),
          costPrice: Number(p?.costPrice ?? 0),
        };
      } else if (field === 'newStock') {
        next[index] = { ...next[index], newStock: Number(value) };
      } else {
        next[index] = { ...next[index], [field]: value };
      }

      return next;
    });
  };

  const itemDelta = (item) => Number(item.newStock) - Number(item.currentStock);

  const calculateItemValueImpact = (item) => {
    // value impact = delta * costPrice (can be negative)
    return itemDelta(item) * Number(item.costPrice || 0);
  };

  const totals = useMemo(() => {
    return items.reduce(
      (acc, it) => {
        const delta = itemDelta(it);
        acc.items += it.productId ? 1 : 0;
        acc.deltaQty += delta;
        acc.valueImpact += calculateItemValueImpact(it);
        return acc;
      },
      { items: 0, deltaQty: 0, valueImpact: 0 }
    );
  }, [items]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for adjustment');
      return;
    }

    const validItems = items.filter((it) => it.productId && !Number.isNaN(Number(it.newStock)));
    if (validItems.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    try {
      // Update stock in backend per item
      for (const it of validItems) {
        await productAPI.updateStock(it.productId, { stockQuantity: Number(it.newStock) });
      }

      // Save local adjustment history
      const record = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        adjustmentNo: `ADJ-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${String(Date.now()).slice(-5)}`,
        adjustmentDate: new Date().toISOString(),
        reason: reason.trim(),
        notes: notes.trim(),
        status: 'applied',
        items: validItems.map((it) => ({
          productId: Number(it.productId),
          productName: it.productName,
          sku: it.sku,
          unit: it.unit,
          currentStock: Number(it.currentStock),
          newStock: Number(it.newStock),
          delta: itemDelta(it),
          costPrice: Number(it.costPrice || 0),
          valueImpact: calculateItemValueImpact(it),
        })),
        itemCount: validItems.length,
        totalQuantity: validItems.reduce((s, it) => s + itemDelta(it), 0),
        totalValue: validItems.reduce((s, it) => s + calculateItemValueImpact(it), 0),
      };

      const next = [record, ...adjustments];
      saveLocalAdjustments(next);

      toast.success('Stock updated successfully');
      setShowForm(false);
      setReason('');
      setNotes('');
      setItems([
        {
          productId: '',
          productName: '',
          sku: '',
          unit: 'pcs',
          currentStock: 0,
          newStock: 0,
          costPrice: 0,
        },
      ]);

      // reload products to reflect latest stock
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update stock');
    }
  };

  const filteredAdjustments = useMemo(() => {
    const s = search.toLowerCase();
    return adjustments.filter(
      (a) =>
        String(a.reason || '').toLowerCase().includes(s) ||
        String(a.adjustmentNo || '').toLowerCase().includes(s)
    );
  }, [adjustments, search]);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Package className="mr-3" />
                Stock Adjustment (স্টক সমন্বয়)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Updates product stockQuantity (backend-aligned)
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Plus className="mr-2" size={18} />
                New Adjustment
              </button>
              <button
                onClick={() => {
                  loadLocalAdjustments();
                  fetchProducts();
                }}
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

        {/* Form */}
        {showForm && (
          <div
            className={`mb-6 rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Update Stock Quantity</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                type="button"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Reason *</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Physical recount / correction / damage write-off"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1 rounded-lg bg-green-500/20 text-green-200 hover:bg-green-500/30 flex items-center"
                  >
                    <Plus className="mr-1" size={16} />
                    Add Item
                  </button>
                </div>

                {items.map((item, index) => (
                  <div key={index} className={`p-4 rounded-lg mb-4 ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">Item #{index + 1}</h4>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Product *</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Select Product</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {(p.sku || p.code || p.id)} - {p.name} (Stock: {Number(p.stockQuantity ?? 0)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Current Stock</label>
                        <input
                          type="number"
                          value={item.currentStock}
                          disabled
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          } opacity-80`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">New Stock *</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.newStock}
                          onChange={(e) => handleItemChange(index, 'newStock', e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>

                    {item.productId && (
                      <div className="mt-3 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {itemDelta(item) === 0 ? (
                            <span className="text-gray-500">No change</span>
                          ) : (
                            <span className={`font-bold ${itemDelta(item) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              Δ {itemDelta(item)} {item.unit}
                            </span>
                          )}
                          {Number(item.newStock) < 0 && (
                            <span className="inline-flex items-center gap-1 text-red-400">
                              <AlertTriangle size={14} /> Invalid stock
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-green-600">
                          Value impact: {formatBDT(calculateItemValueImpact(item))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Summary</h3>
                  <Calculator size={20} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Items</p>
                    <p className="text-xl font-bold">{totals.items}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Δ Quantity</p>
                    <p className={`text-xl font-bold ${totals.deltaQty >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totals.deltaQty >= 0 ? '+' : ''}
                      {totals.deltaQty}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Value Impact</p>
                    <p className="text-xl font-bold text-green-600">{formatBDT(totals.valueImpact)}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className={`px-6 py-2 rounded-lg border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}
                >
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center">
                  <Save className="mr-2" size={18} />
                  Apply
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading...</p>
          </div>
        ) : (
          <>
            <div
              className={`mb-6 rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search adjustments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>

            <div
              className={`rounded-xl overflow-hidden mb-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="text-left py-3 px-6">Adjustment No</th>
                      <th className="text-left py-3 px-6">Date</th>
                      <th className="text-left py-3 px-6">Reason</th>
                      <th className="text-left py-3 px-6">Items</th>
                      <th className="text-left py-3 px-6">Total Δ Qty</th>
                      <th className="text-left py-3 px-6">Value Impact</th>
                      <th className="text-left py-3 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdjustments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-500">
                          No adjustments found (stored locally)
                        </td>
                      </tr>
                    ) : (
                      filteredAdjustments.map((a) => (
                        <tr
                          key={a.id}
                          className={`border-b ${
                            theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <td className="py-3 px-6 font-bold">{a.adjustmentNo}</td>
                          <td className="py-3 px-6">{new Date(a.adjustmentDate).toLocaleString()}</td>
                          <td className="py-3 px-6">
                            <div>
                              <p className="font-medium">{a.reason}</p>
                              {a.notes ? <p className="text-sm text-gray-500 truncate max-w-xs">{a.notes}</p> : null}
                            </div>
                          </td>
                          <td className="py-3 px-6">
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">{a.itemCount} items</span>
                          </td>
                          <td className={`py-3 px-6 font-bold ${a.totalQuantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {a.totalQuantity >= 0 ? '+' : ''}
                            {a.totalQuantity}
                          </td>
                          <td className="py-3 px-6 font-bold text-green-600">{formatBDT(a.totalValue || 0)}</td>
                          <td className="py-3 px-6">
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">applied</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockAdjustment;
