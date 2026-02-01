import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { stockAPI, productAPI } from '../../services/api';
import {
  Truck, Search, Filter, Download,
  Printer, Plus, RefreshCw, Save,
  CheckCircle, XCircle, Eye, Edit,
  Trash2, ArrowRight, Warehouse
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const StockTransfer = () => {
  const { theme } = useTheme();
  
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    reference: '',
    notes: '',
    items: [{
      productId: '',
      productName: '',
      availableStock: 0,
      transferQuantity: 1,
      unitCost: 0,
      batchNo: '',
      serialNo: ''
    }]
  });

  useEffect(() => {
    fetchTransfers();
    fetchProducts();
    fetchWarehouses();
  }, []);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const response = await stockAPI.getTransfers();
      if (response.success) {
        setTransfers(response.data);
      }
    } catch (error) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getProducts();
      if (response.success) {
        setProducts(response.data);
      }
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await stockAPI.getWarehouses();
      if (response.success) {
        setWarehouses(response.data);
      }
    } catch (error) {
      console.error('Failed to load warehouses');
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          productId: '',
          productName: '',
          availableStock: 0,
          transferQuantity: 1,
          unitCost: 0,
          batchNo: '',
          serialNo: ''
        }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'productId') {
      const product = products.find(p => p.id === parseInt(value));
      newItems[index] = {
        ...newItems[index],
        productId: value,
        productName: product ? product.name : '',
        availableStock: product ? product.currentStock : 0,
        unitCost: product ? product.costPrice : 0
      };
    } else {
      newItems[index][field] = value;
      
      // Validate transfer quantity doesn't exceed available stock
      if (field === 'transferQuantity' && value > newItems[index].availableStock) {
        toast.error('Transfer quantity exceeds available stock');
        newItems[index][field] = newItems[index].availableStock;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateItemTotal = (item) => {
    return item.transferQuantity * item.unitCost;
  };

  const calculateFormTotals = () => {
    return formData.items.reduce((totals, item) => {
      totals.quantity += parseFloat(item.transferQuantity || 0);
      totals.value += calculateItemTotal(item);
      return totals;
    }, { quantity: 0, value: 0 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fromWarehouseId || !formData.toWarehouseId) {
      toast.error('Please select both source and destination warehouses');
      return;
    }

    if (formData.fromWarehouseId === formData.toWarehouseId) {
      toast.error('Source and destination warehouses cannot be the same');
      return;
    }

    if (formData.items.some(item => !item.productId || item.transferQuantity <= 0)) {
      toast.error('Please fill all item fields correctly');
      return;
    }

    // Check stock availability
    for (const item of formData.items) {
      if (item.transferQuantity > item.availableStock) {
        toast.error(`Insufficient stock for ${item.productName}. Available: ${item.availableStock}`);
        return;
      }
    }

    try {
      const transferData = {
        fromWarehouseId: parseInt(formData.fromWarehouseId),
        toWarehouseId: parseInt(formData.toWarehouseId),
        reference: formData.reference,
        notes: formData.notes,
        items: formData.items.map(item => ({
          productId: parseInt(item.productId),
          transferQuantity: parseFloat(item.transferQuantity),
          unitCost: parseFloat(item.unitCost),
          batchNo: item.batchNo,
          serialNo: item.serialNo
        }))
      };

      const response = await stockAPI.createTransfer(transferData);
      
      if (response.success) {
        toast.success('Stock transfer created successfully');
        setShowForm(false);
        resetForm();
        fetchTransfers();
      }
    } catch (error) {
      toast.error('Failed to create transfer');
    }
  };

  const resetForm = () => {
    setFormData({
      fromWarehouseId: '',
      toWarehouseId: '',
      reference: '',
      notes: '',
      items: [{
        productId: '',
        productName: '',
        availableStock: 0,
        transferQuantity: 1,
        unitCost: 0,
        batchNo: '',
        serialNo: ''
      }]
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-600', bg: 'bg-green-500/20', icon: <CheckCircle size={14} /> };
      case 'in_transit':
        return { color: 'text-yellow-600', bg: 'bg-yellow-500/20', icon: <Truck size={14} /> };
      case 'pending':
        return { color: 'text-blue-600', bg: 'bg-blue-500/20', icon: <RefreshCw size={14} /> };
      case 'cancelled':
        return { color: 'text-red-600', bg: 'bg-red-500/20', icon: <XCircle size={14} /> };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-500/20', icon: null };
    }
  };

  const getWarehouseName = (id) => {
    const warehouse = warehouses.find(w => w.id === id);
    return warehouse ? warehouse.name : 'Unknown';
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
                Stock Transfer (স্টক স্থানান্তর)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Transfer stock between warehouses
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Plus className="mr-2" size={18} />
                New Transfer
              </button>
              <button
                onClick={fetchTransfers}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center"
              >
                <RefreshCw className="mr-2" size={18} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        {showForm && (
          <div className={`mb-6 rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create Stock Transfer</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Transfer Header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">From Warehouse *</label>
                  <select
                    value={formData.fromWarehouseId}
                    onChange={(e) => setFormData({...formData, fromWarehouseId: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Select Source</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-center">
                  <ArrowRight className="text-gray-400 mt-6" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">To Warehouse *</label>
                  <select
                    value={formData.toWarehouseId}
                    onChange={(e) => setFormData({...formData, toWarehouseId: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">Select Destination</option>
                    {warehouses.map(warehouse => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Reference</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Transfer reference..."
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Transfer Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1 rounded-lg bg-green-500/20 text-green-700 hover:bg-green-500/30 flex items-center"
                  >
                    <Plus className="mr-1" size={16} />
                    Add Item
                  </button>
                </div>

                {formData.items.map((item, index) => (
                  <div key={index} className={`p-4 rounded-lg mb-4 ${
                    theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold">Item #{index + 1}</h4>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 rounded text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Product *</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Select Product</option>
                          {products.map(product => (
                            <option key={product.id} value={product.id}>
                              {product.code} - {product.name} (Stock: {product.currentStock})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Transfer Qty *</label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            max={item.availableStock}
                            value={item.transferQuantity}
                            onChange={(e) => handleItemChange(index, 'transferQuantity', e.target.value)}
                            className={`w-full px-4 py-2 rounded-lg border ${
                              theme === 'dark' 
                                ? 'bg-gray-700 border-gray-600' 
                                : 'bg-white border-gray-300'
                            }`}
                          />
                          <span className="ml-2 text-gray-500">{item.unit}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {item.availableStock}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Unit Cost (৳)</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => handleItemChange(index, 'unitCost', e.target.value)}
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Batch No</label>
                        <input
                          type="text"
                          value={item.batchNo}
                          onChange={(e) => handleItemChange(index, 'batchNo', e.target.value)}
                          placeholder="Batch number..."
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Serial No</label>
                        <input
                          type="text"
                          value={item.serialNo}
                          onChange={(e) => handleItemChange(index, 'serialNo', e.target.value)}
                          placeholder="Serial number..."
                          className={`w-full px-4 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Item Summary */}
                    {item.productId && (
                      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
                        <div className={`p-2 rounded ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <p className="text-gray-500">Available Stock</p>
                          <p className="font-bold">{item.availableStock} {item.unit}</p>
                        </div>
                        <div className={`p-2 rounded ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <p className="text-gray-500">Remaining After Transfer</p>
                          <p className="font-bold">
                            {(item.availableStock - (item.transferQuantity || 0)).toFixed(2)} {item.unit}
                          </p>
                        </div>
                        <div className={`p-2 rounded ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <p className="text-gray-500">Item Value</p>
                          <p className="font-bold text-green-600">
                            {formatBDT(calculateItemTotal(item))}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Form Summary */}
              <div className={`p-4 rounded-lg mb-6 ${
                theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">Transfer Summary</h3>
                  <Truck size={20} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                    <p className="text-xl font-bold">{formData.items.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
                    <p className="text-xl font-bold">
                      {calculateFormTotals().quantity.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatBDT(calculateFormTotals().value)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Warehouses</p>
                    <p className="text-xl font-bold">
                      {formData.fromWarehouseId && formData.toWarehouseId ? '2' : '0'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes and Actions */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  placeholder="Additional notes about the transfer..."
                  className={`w-full px-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                >
                  <Save className="mr-2" size={18} />
                  Create Transfer
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Transfers List */}
        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading transfers...</p>
          </div>
        ) : (
          <>
            {/* Search Filter */}
            <div className={`mb-6 rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="relative flex-1 mr-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search transfers..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center">
                    <Filter className="mr-2" size={18} />
                    Filter
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-red-500/20 text-red-700 hover:bg-red-500/30 flex items-center">
                    <Download className="mr-2" size={18} />
                    Export
                  </button>
                </div>
              </div>
            </div>

            {/* Transfers Table */}
            <div className={`rounded-xl overflow-hidden mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className="text-left py-3 px-6">Transfer No</th>
                      <th className="text-left py-3 px-6">Date</th>
                      <th className="text-left py-3 px-6">From → To</th>
                      <th className="text-left py-3 px-6">Items</th>
                      <th className="text-left py-3 px-6">Quantity</th>
                      <th className="text-left py-3 px-6">Value</th>
                      <th className="text-left py-3 px-6">Status</th>
                      <th className="text-left py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-gray-500">
                          No transfers found
                        </td>
                      </tr>
                    ) : (
                      transfers
                        .filter(transfer => 
                          transfer.reference?.toLowerCase().includes(search.toLowerCase()) ||
                          transfer.transferNo.toLowerCase().includes(search.toLowerCase())
                        )
                        .map((transfer) => {
                          const statusBadge = getStatusBadge(transfer.status);
                          
                          return (
                            <tr 
                              key={transfer.id}
                              className={`border-b ${
                                theme === 'dark' 
                                  ? 'border-gray-700 hover:bg-gray-750' 
                                  : 'border-gray-100 hover:bg-gray-50'
                              }`}
                            >
                              <td className="py-3 px-6">
                                <p className="font-bold">{transfer.transferNo}</p>
                                {transfer.reference && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Ref: {transfer.reference}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-6">
                                <p>{new Date(transfer.transferDate).toLocaleDateString()}</p>
                                {transfer.receivedDate && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Received: {new Date(transfer.receivedDate).toLocaleDateString()}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-6">
                                <div className="flex items-center">
                                  <Warehouse className="mr-2 text-gray-400" size={14} />
                                  <div>
                                    <p className="font-medium">{getWarehouseName(transfer.fromWarehouseId)}</p>
                                    <ArrowRight className="inline mx-1" size={12} />
                                    <p className="font-medium">{getWarehouseName(transfer.toWarehouseId)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-6">
                                <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">
                                  {transfer.itemCount || 0} items
                                </span>
                              </td>
                              <td className="py-3 px-6">
                                <span className="font-bold">
                                  {transfer.totalQuantity || 0}
                                </span>
                              </td>
                              <td className="py-3 px-6">
                                <span className="font-bold text-green-600">
                                  {formatBDT(transfer.totalValue || 0)}
                                </span>
                              </td>
                              <td className="py-3 px-6">
                                <span className={`px-2 py-1 rounded text-xs ${statusBadge.bg} ${statusBadge.color} flex items-center`}>
                                  {statusBadge.icon && <span className="mr-1">{statusBadge.icon}</span>}
                                  {transfer.status}
                                </span>
                              </td>
                              <td className="py-3 px-6">
                                <div className="flex items-center space-x-2">
                                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    <Eye size={16} />
                                  </button>
                                  {transfer.status === 'pending' && (
                                    <>
                                      <button 
                                        onClick={() => {
                                          // Receive transfer functionality
                                          toast('Receive transfer functionality');
                                        }}
                                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded text-green-600"
                                      >
                                        <CheckCircle size={16} />
                                      </button>
                                      <button className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600">
                                        <XCircle size={16} />
                                      </button>
                                    </>
                                  )}
                                  {transfer.status === 'in_transit' && (
                                    <button className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600">
                                      <Truck size={16} />
                                    </button>
                                  )}
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

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Transfers
                    </p>
                    <p className="text-2xl font-bold">{transfers.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600">
                    <Truck size={24} />
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      In Transit
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {transfers.filter(t => t.status === 'in_transit').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/20 text-yellow-600">
                    <Truck size={24} />
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Completed
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {transfers.filter(t => t.status === 'completed').length}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <CheckCircle size={24} />
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Value Transferred
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBDT(
                        transfers.reduce((sum, t) => sum + (t.totalValue || 0), 0)
                      )}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockTransfer;
