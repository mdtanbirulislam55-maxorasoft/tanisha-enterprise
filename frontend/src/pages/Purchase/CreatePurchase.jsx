import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { purchaseAPI, productAPI } from '../../services/api';
import {
  Plus, Minus, Trash2, Truck, UserPlus,
  Search, Calculator, Save, X, Package,
  Building, DollarSign, Percent
} from 'lucide-react';
import toast from 'react-hot-toast';

const LOCAL_SUPPLIERS_KEY = 'tanisha_suppliers_v1';
const LOCAL_WAREHOUSES_KEY = 'tanisha_warehouses_v1';

const unwrap = (res) => {
  if (!res) return { ok: false, data: null, error: 'No response' };
  if (typeof res.success === 'boolean') return { ok: res.success, data: res.data, error: res.error };
  if (res.data && typeof res.data.success === 'boolean') return { ok: res.data.success, data: res.data.data, error: res.data.error };
  return { ok: false, data: null, error: 'Unexpected response shape' };
};

const normalizeProduct = (p) => ({
  id: p.id,
  name: p.name || 'Unnamed',
  code: p.sku || p.code || String(p.id),
  unit: p.unit || 'pcs',
  costPrice: Number(p.costPrice ?? 0),
});

const defaultWarehouses = [
  { id: 1, name: 'Main Warehouse' },
  { id: 2, name: 'Showroom' }
];

const CreatePurchase = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [supplier, setSupplier] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState(defaultWarehouses);
  const [warehouseId, setWarehouseId] = useState(1);

  const [products, setProducts] = useState([]);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);

  const [referenceNo, setReferenceNo] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');

  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [otherCharges, setOtherCharges] = useState(0);

  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    company: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    fetchSuppliers();
    fetchProducts();
    fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subtotalCalc = items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
    setSubtotal(subtotalCalc);

    const disc = Number(discount || 0);
    const taxCalc = Math.max(0, (subtotalCalc - disc) * 0.15);
    setTax(taxCalc);

    const totalCalc = subtotalCalc - disc + taxCalc + Number(shipping || 0) + Number(otherCharges || 0);
    setTotalAmount(totalCalc);
  }, [items, discount, shipping, otherCharges]);

  const loadLocal = (key) => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveLocal = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      const u = unwrap(res);
      if (u.ok) setProducts((u.data || []).map(normalizeProduct));
      else {
        setProducts([]);
        toast.error(u.error || 'Failed to load products');
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
      toast.error('Failed to load products');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await purchaseAPI.getSuppliers?.();
      if (!res) {
        setSuppliers(loadLocal(LOCAL_SUPPLIERS_KEY));
        return;
      }
      const u = unwrap(res);
      if (u.ok) {
        const list = Array.isArray(u.data) ? u.data : (u.data?.suppliers || []);
        setSuppliers(list);
        saveLocal(LOCAL_SUPPLIERS_KEY, list);
      } else {
        setSuppliers(loadLocal(LOCAL_SUPPLIERS_KEY));
      }
    } catch (e) {
      console.error(e);
      setSuppliers(loadLocal(LOCAL_SUPPLIERS_KEY));
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await purchaseAPI.getWarehouses?.();
      if (!res) {
        const local = loadLocal(LOCAL_WAREHOUSES_KEY);
        setWarehouses(local.length ? local : defaultWarehouses);
        return;
      }
      const u = unwrap(res);
      if (u.ok) {
        const list = Array.isArray(u.data) ? u.data : (u.data?.warehouses || u.data || []);
        setWarehouses(list.length ? list : defaultWarehouses);
        saveLocal(LOCAL_WAREHOUSES_KEY, list);
      } else {
        const local = loadLocal(LOCAL_WAREHOUSES_KEY);
        setWarehouses(local.length ? local : defaultWarehouses);
      }
    } catch (e) {
      console.error(e);
      const local = loadLocal(LOCAL_WAREHOUSES_KEY);
      setWarehouses(local.length ? local : defaultWarehouses);
    }
  };

  const handleAddProduct = (product) => {
    const existing = items.find((it) => it.productId === product.id);

    if (existing) {
      setItems((prev) =>
        prev.map((it) => (it.productId === product.id ? { ...it, quantity: it.quantity + 1 } : it))
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit,
          quantity: 1,
          unitPrice: product.costPrice || 0
        }
      ]);
    }

    setShowProductModal(false);
    setSearchTerm('');
  };

  const handleRemoveItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleQuantityChange = (index, newQuantity) => {
    const qty = Number(newQuantity);
    if (!Number.isFinite(qty) || qty < 1) return;
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: qty };
      return next;
    });
  };

  const handlePriceChange = (index, newPrice) => {
    const price = Number(newPrice);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], unitPrice: Number.isFinite(price) ? price : 0 };
      return next;
    });
  };

  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) {
      toast.error('Supplier name and phone are required');
      return;
    }

    try {
      if (purchaseAPI.createSupplier) {
        const res = await purchaseAPI.createSupplier(newSupplier);
        const u = unwrap(res);
        if (u.ok) {
          const created = u.data;
          const next = [...suppliers, created];
          setSuppliers(next);
          saveLocal(LOCAL_SUPPLIERS_KEY, next);
          setSupplier(created);
          setNewSupplier({ name: '', company: '', contactPerson: '', phone: '', email: '', address: '' });
          setShowSupplierModal(false);
          toast.success('Supplier created successfully');
          return;
        }
      }

      // fallback local
      const created = { id: Date.now(), ...newSupplier };
      const next = [...suppliers, created];
      setSuppliers(next);
      saveLocal(LOCAL_SUPPLIERS_KEY, next);
      setSupplier(created);
      setNewSupplier({ name: '', company: '', contactPerson: '', phone: '', email: '', address: '' });
      setShowSupplierModal(false);
      toast.success('Supplier created (local)');
    } catch (e) {
      console.error(e);
      toast.error('Failed to create supplier');
    }
  };

  const handleSubmitPurchase = async () => {
    if (!supplier) {
      toast.error('Please select a supplier');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    const payload = {
      supplierId: supplier.id,
      items: items.map((it) => ({
        productId: it.productId,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice)
      })),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      shipping: Number(shipping || 0),
      otherCharges: Number(otherCharges || 0),
      referenceNo: referenceNo || '',
      invoiceNo: invoiceNo || '',
      notes: '',
      warehouseId: Number(warehouseId || 1)
    };

    setLoading(true);
    try {
      const res = await purchaseAPI.createPurchase(payload);
      const u = unwrap(res);

      if (!u.ok) {
        toast.error(u.error || 'Failed to create purchase');
        return;
      }

      toast.success(`Purchase order created! PO: ${u.data?.purchaseNumber || u.data?.poNumber || 'N/A'}`);

      setItems([]);
      setSupplier(null);
      setDiscount(0);
      setShipping(0);
      setOtherCharges(0);
      setReferenceNo('');
      setInvoiceNo('');

      navigate('/purchase/list');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.error || 'Failed to create purchase');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(s) || p.code.toLowerCase().includes(s));
  }, [products, searchTerm]);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Truck className="mr-3" />
                Create Purchase Order (ক্রয় অর্ডার তৈরি)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Stock Purchase
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/purchase/list')}
                className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                type="button"
              >
                View Purchases
              </button>
              <button
                onClick={handleSubmitPurchase}
                disabled={loading || items.length === 0}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                type="button"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    Create Purchase Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Supplier Section */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <Building className="mr-2" />
                  Supplier Information (সরবরাহকারী তথ্য)
                </h2>
                <button
                  onClick={() => setShowSupplierModal(true)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
                  type="button"
                >
                  <UserPlus size={18} className="mr-2" />
                  New Supplier
                </button>
              </div>

              {supplier ? (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-blue-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{supplier.name}</h3>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {supplier.company ? `${supplier.company} • ` : ''}
                        {supplier.phone}
                      </p>
                      {supplier.address ? (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>
                          {supplier.address}
                        </p>
                      ) : null}
                    </div>
                    <button
                      onClick={() => setSupplier(null)}
                      className="text-sm text-red-500 hover:text-red-400"
                      type="button"
                    >
                      Change Supplier
                    </button>
                  </div>
                </div>
              ) : (
                <div className={`p-8 text-center rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-gray-700 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}`}>
                  <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Supplier Selected</p>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select an existing supplier or create a new one
                  </p>

                  <div className="flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        if (suppliers.length > 0) setSupplier(suppliers[0]);
                        else toast.info('No suppliers found. Create a new one.');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                      type="button"
                    >
                      Select First Supplier
                    </button>
                    <button
                      onClick={() => setShowSupplierModal(true)}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg"
                      type="button"
                    >
                      Create New
                    </button>
                  </div>
                </div>
              )}

              {!supplier && suppliers.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Or pick supplier</label>
                  <select
                    className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    defaultValue=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      const found = suppliers.find((s) => String(s.id) === String(id));
                      if (found) setSupplier(found);
                    }}
                  >
                    <option value="">Select...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Products Section */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <Package className="mr-2" />
                  Purchase Items (ক্রয়কৃত পণ্য)
                </h2>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                  type="button"
                >
                  <Plus size={18} className="mr-2" />
                  Add Product
                </button>
              </div>

              {items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className="text-left py-3 font-medium">Product</th>
                        <th className="text-left py-3 font-medium">Unit</th>
                        <th className="text-left py-3 font-medium">Quantity</th>
                        <th className="text-left py-3 font-medium">Unit Cost</th>
                        <th className="text-left py-3 font-medium">Total</th>
                        <th className="text-left py-3 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr
                          key={`${item.productId}-${index}`}
                          className={`border-b ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'}`}
                        >
                          <td className="py-3">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {item.productCode}
                              </p>
                            </div>
                          </td>
                          <td className="py-3">{item.unit}</td>
                          <td className="py-3">
                            <div className="flex items-center">
                              <button
                                onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                className={`p-1 rounded-l ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                type="button"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(index, parseInt(e.target.value, 10))}
                                className={`w-16 text-center border-y p-1 ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                                min="1"
                              />
                              <button
                                onClick={() => handleQuantityChange(index, item.quantity + 1)}
                                className={`p-1 rounded-r ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                                type="button"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="py-3">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handlePriceChange(index, e.target.value)}
                              className={`w-32 px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                            />
                          </td>
                          <td className="py-3 font-bold">
                            ৳ {(Number(item.unitPrice) * Number(item.quantity)).toLocaleString()}
                          </td>
                          <td className="py-3">
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-2 text-red-500 hover:text-red-400"
                              type="button"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={`p-8 text-center rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-gray-700 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}`}>
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Products Added</p>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Add products to purchase</p>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    type="button"
                  >
                    Add First Product
                  </button>
                </div>
              )}
            </div>

            {/* Reference Information */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">Reference Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Reference No</label>
                  <input
                    type="text"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="REF-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Supplier Invoice No</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="INV-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Warehouse</label>
                  <select
                    value={warehouseId}
                    onChange={(e) => setWarehouseId(parseInt(e.target.value, 10))}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Summary */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Calculator className="mr-2" />
                Purchase Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold">৳ {subtotal.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Discount</span>
                  <div className="flex items-center">
                    <Percent size={16} className="mr-1" />
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      className={`w-24 px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <span>Tax (15%)</span>
                  <span>৳ {tax.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Shipping</span>
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-1" />
                    <input
                      type="number"
                      value={shipping}
                      onChange={(e) => setShipping(Number(e.target.value) || 0)}
                      className={`w-24 px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Other Charges</span>
                  <div className="flex items-center">
                    <DollarSign size={16} className="mr-1" />
                    <input
                      type="number"
                      value={otherCharges}
                      onChange={(e) => setOtherCharges(Number(e.target.value) || 0)}
                      className={`w-24 px-2 py-1 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    />
                  </div>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-green-600">৳ {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setItems([]);
                    setSupplier(null);
                    setDiscount(0);
                    setShipping(0);
                    setOtherCharges(0);
                  }}
                  className="py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  type="button"
                >
                  Clear All
                </button>
                <button
                  onClick={() => navigate('/purchase/list')}
                  className="py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  type="button"
                >
                  View Purchases
                </button>
                <button
                  className="py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                  type="button"
                  onClick={() => toast.info('Draft saving not implemented yet')}
                >
                  Save Draft
                </button>
                <button
                  className="py-2 rounded-lg bg-yellow-50 hover:bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50"
                  type="button"
                  onClick={() => window.print()}
                >
                  Print PO
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-700 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Select Products</h3>
                <button
                  onClick={() => {
                    setShowProductModal(false);
                    setSearchTerm('');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or code..."
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                        theme === 'dark' ? 'border-gray-700 hover:border-blue-500 bg-gray-700/30' : 'border-gray-200 hover:border-blue-500 bg-gray-50'
                      }`}
                      onClick={() => handleAddProduct(product)}
                    >
                      <h4 className="font-bold">{product.name}</h4>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Code: {product.code}</p>
                      <div className="mt-3 pt-3 border-t border-gray-700 dark:border-gray-600">
                        <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" type="button">
                          Add to PO
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No products found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supplier Modal */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-700 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Create New Supplier</h3>
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  type="button"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    value={newSupplier.company}
                    onChange={(e) => setNewSupplier({ ...newSupplier, company: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={newSupplier.contactPerson}
                    onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    rows="2"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowSupplierModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSupplier}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  type="button"
                >
                  Create Supplier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePurchase;
