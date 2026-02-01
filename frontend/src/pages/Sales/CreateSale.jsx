import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { salesAPI, productAPI } from '../../services/api';
import {
  Plus, Minus, Trash2, ShoppingCart, UserPlus,
  Search, Calculator, Save, X, Package, Users, DollarSign, Percent, Truck
} from 'lucide-react';
import toast from 'react-hot-toast';

const LOCAL_CUSTOMERS_KEY = 'tanisha_customers_v1';

const unwrap = (res) => {
  // supports both axios style { data: { success, data } } and direct { success, data }
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
  category: p.category || 'Uncategorized',
  costPrice: Number(p.costPrice ?? 0),
  sellPrice: Number(p.sellingPrice ?? p.sellPrice ?? p.salePrice ?? 0),
  stockQuantity: Number(p.stockQuantity ?? 0),
  lowStockThreshold: Number(p.lowStockThreshold ?? 5),
});

const CreateSale = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // customer
  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // products
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // sale items
  const [items, setItems] = useState([]);

  // totals
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);

  const [subtotal, setSubtotal] = useState(0);
  const [tax, setTax] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [dueAmount, setDueAmount] = useState(0);

  const [loading, setLoading] = useState(false);

  // new customer
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    company: ''
  });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    calculateTotals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, discount, shipping, paidAmount]);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      const u = unwrap(res);
      if (u.ok) {
        setProducts((u.data || []).map(normalizeProduct));
      } else {
        setProducts([]);
        toast.error(u.error || 'Failed to load products');
      }
    } catch (e) {
      console.error(e);
      setProducts([]);
      toast.error('Failed to load products');
    }
  };

  const loadLocalCustomers = () => {
    try {
      const raw = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveLocalCustomers = (list) => {
    localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(list));
  };

  const fetchCustomers = async () => {
    try {
      const res = await salesAPI.getCustomers?.();
      if (!res) {
        // no endpoint yet
        setCustomers(loadLocalCustomers());
        return;
      }
      const u = unwrap(res);
      if (u.ok) {
        // allow both {customers: []} and direct array
        const list = Array.isArray(u.data) ? u.data : (u.data?.customers || []);
        setCustomers(list);
        saveLocalCustomers(list);
      } else {
        setCustomers(loadLocalCustomers());
      }
    } catch (e) {
      console.error(e);
      setCustomers(loadLocalCustomers());
    }
  };

  const calculateTotals = () => {
    const subtotalCalc = items.reduce((sum, item) => sum + (Number(item.unitPrice) * Number(item.quantity)), 0);
    setSubtotal(subtotalCalc);

    const discountVal = Number(discount || 0);
    const taxCalc = Math.max(0, (subtotalCalc - discountVal) * 0.15); // 15% VAT
    setTax(taxCalc);

    const totalCalc = subtotalCalc - discountVal + taxCalc + Number(shipping || 0);
    setTotalAmount(totalCalc);

    const dueCalc = totalCalc - Number(paidAmount || 0);
    setDueAmount(dueCalc > 0 ? dueCalc : 0);
  };

  const handleAddProduct = (product) => {
    if (product.stockQuantity <= 0) {
      toast.error('This product is out of stock');
      return;
    }

    const existingItem = items.find((it) => it.productId === product.id);

    if (existingItem) {
      setItems((prev) =>
        prev.map((it) =>
          it.productId === product.id
            ? { ...it, quantity: Math.min(it.quantity + 1, product.stockQuantity) }
            : it
        )
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
          unitPrice: product.sellPrice,
          costPrice: product.costPrice,
          stock: product.stockQuantity
        }
      ]);
    }

    setShowProductModal(false);
    setSearchTerm('');
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index, newQuantity) => {
    const qty = Number(newQuantity);
    if (!Number.isFinite(qty) || qty < 1) return;

    const item = items[index];
    if (qty > item.stock) {
      toast.error(`Only ${item.stock} items available in stock`);
      return;
    }

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

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error('Customer name and phone are required');
      return;
    }

    // Try backend; fallback to local storage
    try {
      if (salesAPI.createCustomer) {
        const res = await salesAPI.createCustomer(newCustomer);
        const u = unwrap(res);
        if (u.ok) {
          const created = u.data;
          const next = [...customers, created];
          setCustomers(next);
          saveLocalCustomers(next);
          setCustomer(created);
          setNewCustomer({ name: '', phone: '', email: '', address: '', company: '' });
          setShowCustomerModal(false);
          toast.success('Customer created successfully');
          return;
        }
      }

      // fallback local
      const created = {
        id: Date.now(),
        ...newCustomer,
        currentBalance: 0
      };
      const next = [...customers, created];
      setCustomers(next);
      saveLocalCustomers(next);
      setCustomer(created);
      setNewCustomer({ name: '', phone: '', email: '', address: '', company: '' });
      setShowCustomerModal(false);
      toast.success('Customer created (local)');
    } catch (e) {
      console.error(e);
      toast.error('Failed to create customer');
    }
  };

  const handleSubmitSale = async () => {
    if (!customer) {
      toast.error('Please select a customer');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one product');
      return;
    }
    if (paidAmount > totalAmount) {
      toast.error('Paid amount cannot be greater than total amount');
      return;
    }

    const saleData = {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice)
      })),
      discount: Number(discount || 0),
      tax: Number(tax || 0),
      shipping: Number(shipping || 0),
      notes: '',
      paymentMethod: Number(paidAmount || 0) > 0 ? 'cash' : 'credit',
      paidAmount: Number(paidAmount || 0)
    };

    setLoading(true);
    try {
      const res = await salesAPI.createSale(saleData);
      const u = unwrap(res);

      if (!u.ok) {
        toast.error(u.error || 'Failed to create sale');
        return;
      }

      toast.success(`Sale created successfully! Invoice: ${u.data?.invoiceNumber || u.data?.invoiceNo || 'N/A'}`);

      // reset
      setItems([]);
      setCustomer(null);
      setDiscount(0);
      setShipping(0);
      setPaidAmount(0);

      navigate('/sales/list');
    } catch (error) {
      console.error('Create sale error:', error);
      toast.error(error?.response?.data?.error || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const s = searchTerm.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(s) ||
      p.code.toLowerCase().includes(s) ||
      (p.category || '').toLowerCase().includes(s)
    );
  }, [products, searchTerm]);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <ShoppingCart className="mr-3" />
                Create New Sale (নতুন বিক্রয় তৈরি)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Invoice Creation
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/sales/list')}
                className={`px-4 py-2 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                View Sales
              </button>

              <button
                onClick={handleSubmitSale}
                disabled={loading || items.length === 0}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    Save & Create Invoice
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Section */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center">
                  <Users className="mr-2" />
                  Customer Information (গ্রাহক তথ্য)
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCustomerModal(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center"
                  >
                    <UserPlus size={18} className="mr-2" />
                    New Customer
                  </button>
                </div>
              </div>

              {customer ? (
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700/40' : 'bg-blue-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{customer.name}</h3>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                        {customer.company ? `${customer.company} • ` : ''}
                        {customer.phone}
                      </p>
                      {customer.address ? (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-700'}`}>
                          {customer.address}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => setCustomer(null)}
                        className="mt-2 text-sm text-red-500 hover:text-red-400"
                      >
                        Change Customer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-8 text-center rounded-lg border-2 border-dashed ${theme === 'dark' ? 'border-gray-700 bg-gray-700/30' : 'border-gray-300 bg-gray-50'}`}>
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Customer Selected</p>
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Select an existing customer or create a new one
                  </p>

                  <div className="flex justify-center gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        if (customers.length > 0) setCustomer(customers[0]);
                        else toast.info('No customers found. Create a new one.');
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                      Select First Customer
                    </button>
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg"
                    >
                      Create New
                    </button>
                  </div>
                </div>
              )}

              {/* Simple customer picker */}
              {!customer && customers.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Or pick customer</label>
                  <select
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                    defaultValue=""
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) return;
                      const found = customers.find((c) => String(c.id) === String(id));
                      if (found) setCustomer(found);
                    }}
                  >
                    <option value="">Select...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone})
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
                  Products (পণ্য)
                </h2>
                <button
                  onClick={() => setShowProductModal(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
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
                        <th className="text-left py-3 font-medium">Unit Price</th>
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
                                {item.productCode} • Stock: {item.stock}
                              </p>
                            </div>
                          </td>
                          <td className="py-3">{item.unit}</td>
                          <td className="py-3">
                            <div className="flex items-center">
                              <button
                                onClick={() => handleQuantityChange(index, item.quantity - 1)}
                                className={`p-1 rounded-l ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
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
                  <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Add products from inventory
                  </p>
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add First Product
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Summary */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <Calculator className="mr-2" />
                Invoice Summary
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
                  <span className="flex items-center">
                    <Truck size={16} className="mr-1" />
                    Shipping
                  </span>
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

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount</span>
                    <span className="text-blue-600">৳ {totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h2 className="text-lg font-bold mb-4">Payment</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Paid Amount</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {[500, 1000, 2000, 5000, 10000, totalAmount].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setPaidAmount(amount === totalAmount ? totalAmount : (Number(paidAmount) + amount))}
                      className={`py-2 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                      type="button"
                    >
                      {amount === totalAmount ? 'Full' : `+৳${amount}`}
                    </button>
                  ))}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Due Amount</span>
                    <span className={`font-bold ${dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ৳ {dueAmount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Payment Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      dueAmount === 0
                        ? 'bg-green-500/20 text-green-200'
                        : paidAmount === 0
                        ? 'bg-red-500/20 text-red-200'
                        : 'bg-yellow-500/20 text-yellow-200'
                    }`}>
                      {dueAmount === 0 ? 'Paid' : paidAmount === 0 ? 'Unpaid' : 'Partial'}
                    </span>
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
                    setCustomer(null);
                    setDiscount(0);
                    setShipping(0);
                    setPaidAmount(0);
                  }}
                  className="py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  type="button"
                >
                  Clear All
                </button>
                <button
                  onClick={() => navigate('/sales/list')}
                  className="py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                  type="button"
                >
                  View Sales
                </button>
                <button
                  className="py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                  type="button"
                  onClick={() => toast.info('Draft saving not implemented yet')}
                >
                  Save Draft
                </button>
                <button
                  className="py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50"
                  type="button"
                  onClick={() => window.print()}
                >
                  Print Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-700 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Select Products (পণ্য নির্বাচন করুন)</h3>
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
                  placeholder="Search by name, code, or category..."
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
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold">{product.name}</h4>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Code: {product.code} • {product.category}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          product.stockQuantity > 10
                            ? 'bg-green-500/20 text-green-200'
                            : product.stockQuantity > 0
                            ? 'bg-yellow-500/20 text-yellow-200'
                            : 'bg-red-500/20 text-red-200'
                        }`}>
                          Stock: {product.stockQuantity}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm">Cost Price</p>
                          <p className="font-medium">৳ {Number(product.costPrice || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">Sell Price</p>
                          <p className="font-bold text-green-600">৳ {Number(product.sellPrice || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-700 dark:border-gray-600">
                        <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" type="button">
                          Add to Invoice
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No products found</p>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Creation Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 border-b border-gray-700 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Create New Customer (নতুন গ্রাহক তৈরি)</h3>
                <button
                  onClick={() => setShowCustomerModal(false)}
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
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Company</label>
                  <input
                    type="text"
                    value={newCustomer.company}
                    onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    placeholder="Company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                    rows="2"
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCustomerModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                  type="button"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                  type="button"
                >
                  Create Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSale;
