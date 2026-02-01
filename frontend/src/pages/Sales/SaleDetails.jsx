import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { salesAPI } from '../../services/api';
import {
  Printer, Download, ArrowLeft, DollarSign, Calendar,
  User, Phone, Mail, MapPin, Package, CheckCircle,
  Clock, XCircle, FileText, Truck, CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';
import { formatDate } from '../../utils/bengaliDate';

const SaleDetails = () => {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    bankName: '',
    chequeNo: '',
    mobileBanking: '',
    notes: ''
  });

  useEffect(() => {
    fetchSaleDetails();
  }, [id]);

  const fetchSaleDetails = async () => {
    try {
      const response = await salesAPI.getSaleById(id);
      if (response.success) {
        setSale(response.data);
        setPaymentData(prev => ({
          ...prev,
          amount: response.data.dueAmount
        }));
      }
    } catch (error) {
      toast.error('Failed to load sale details');
      navigate('/sales/list');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentData.amount > sale.dueAmount) {
      toast.error(`Payment amount cannot exceed due amount (${formatBDT(sale.dueAmount)})`);
      return;
    }

    setAddingPayment(true);
    try {
      const response = await salesAPI.addPayment(id, paymentData);
      if (response.success) {
        toast.success('Payment added successfully');
        setAddingPayment(false);
        fetchSaleDetails(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add payment');
    } finally {
      setAddingPayment(false);
    }
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const handleExportInvoice = (format) => {
    toast.info(`Exporting invoice as ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4">Loading sale details...</p>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold mb-2">Sale Not Found</h3>
          <button
            onClick={() => navigate('/sales/list')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg"
          >
            Back to Sales List
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (sale.status === 'cancelled') {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-700">
          <XCircle className="inline mr-1" size={14} />
          Cancelled
        </span>
      );
    }
    
    if (sale.paymentStatus === 'paid') {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-green-500/20 text-green-700">
          <CheckCircle className="inline mr-1" size={14} />
          Paid
        </span>
      );
    }
    
    if (sale.paymentStatus === 'partial') {
      return (
        <span className="px-3 py-1 rounded-full text-sm bg-yellow-500/20 text-yellow-700">
          <Clock className="inline mr-1" size={14} />
          Partial
        </span>
      );
    }
    
    return (
      <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-700">
        <Clock className="inline mr-1" size={14} />
        Unpaid
      </span>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/sales/list')}
                className="p-2 mr-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Invoice Details</h1>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Invoice #{sale.invoiceNumber}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="mr-4">{getStatusBadge()}</div>
              <button
                onClick={() => handleExportInvoice('pdf')}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-700 hover:bg-red-500/30 flex items-center"
              >
                <Download className="mr-2" size={18} />
                PDF
              </button>
              <button
                onClick={handlePrintInvoice}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Printer className="mr-2" size={18} />
                Print
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Invoice Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Header */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Info */}
                <div>
                  <h2 className="text-lg font-bold mb-4">Tanisha Enterprise</h2>
                  <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Agricultural Machinery & Services
                  </p>
                  <p className="mt-2">Dhaka, Bangladesh</p>
                  <p>Phone: +880 1234 567890</p>
                  <p>Email: info@tanisha.com</p>
                </div>

                {/* Invoice Info */}
                <div className="text-right">
                  <h3 className="text-xl font-bold text-blue-600">INVOICE</h3>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Invoice #:</span>
                      <span className="font-bold">{sale.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{formatDate(sale.invoiceDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className="font-medium">{sale.paymentStatus.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <User className="mr-2" />
                Bill To
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-lg">{sale.customerName}</p>
                  {sale.customer?.company && (
                    <p className="text-gray-600 dark:text-gray-400">{sale.customer.company}</p>
                  )}
                  <div className="mt-3 space-y-1">
                    <p className="flex items-center">
                      <Phone className="mr-2" size={16} />
                      {sale.customerPhone}
                    </p>
                    {sale.customer?.email && (
                      <p className="flex items-center">
                        <Mail className="mr-2" size={16} />
                        {sale.customer.email}
                      </p>
                    )}
                    {sale.customer?.address && (
                      <p className="flex items-center">
                        <MapPin className="mr-2" size={16} />
                        {sale.customer.address}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                  <p className={`text-2xl font-bold ${sale.customer?.currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatBDT(sale.customer?.currentBalance || 0)}
                  </p>
                  <p className="text-sm mt-2">Credit Limit: {formatBDT(sale.customer?.creditLimit || 0)}</p>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="text-left py-3 px-6">Product</th>
                      <th className="text-left py-3 px-6">Unit</th>
                      <th className="text-left py-3 px-6">Quantity</th>
                      <th className="text-left py-3 px-6">Unit Price</th>
                      <th className="text-left py-3 px-6">Total</th>
                      <th className="text-left py-3 px-6">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items?.map((item, index) => (
                      <tr 
                        key={index}
                        className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                      >
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {item.productCode}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-6">{item.unit}</td>
                        <td className="py-3 px-6">{item.quantity}</td>
                        <td className="py-3 px-6">{formatBDT(item.unitPrice)}</td>
                        <td className="py-3 px-6 font-bold">{formatBDT(item.totalPrice)}</td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-1 rounded text-xs ${item.profit >= 0 ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                            {formatBDT(item.profit || 0)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="p-6 border-t border-gray-700 dark:border-gray-600">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatBDT(sale.subtotal)}</span>
                    </div>
                    {sale.discount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span className="text-red-600">-{formatBDT(sale.discount)}</span>
                      </div>
                    )}
                    {sale.tax > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatBDT(sale.tax)}</span>
                      </div>
                    )}
                    {sale.shipping > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{formatBDT(sale.shipping)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span className="text-blue-600">{formatBDT(sale.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span className="text-green-600">{formatBDT(sale.paidAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due:</span>
                      <span className={`font-bold ${sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatBDT(sale.dueAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-2">Notes</h3>
                <p className="text-gray-600 dark:text-gray-400">{sale.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Actions & Payments */}
          <div className="space-y-6">
            {/* Payment Status */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <DollarSign className="mr-2" />
                Payment Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Invoice Amount</span>
                  <span className="font-bold">{formatBDT(sale.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid</span>
                  <span className="font-bold">{formatBDT(sale.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status</span>
                  <span className={`font-bold ${sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {sale.paymentStatus.toUpperCase()}
                  </span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-lg">
                    <span>Balance Due</span>
                    <span className={`font-bold ${sale.dueAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatBDT(sale.dueAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Payment Form */}
              {sale.dueAmount > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-bold mb-3">Add Payment</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Amount</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                        <input
                          type="number"
                          value={paymentData.amount}
                          onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value) || 0})}
                          className={`w-full pl-10 pr-3 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                          max={sale.dueAmount}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Payment Method</label>
                      <select
                        value={paymentData.paymentMethod}
                        onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="cash">Cash</option>
                        <option value="bank">Bank Transfer</option>
                        <option value="cheque">Cheque</option>
                        <option value="mobile">Mobile Banking</option>
                      </select>
                    </div>

                    {paymentData.paymentMethod === 'bank' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={paymentData.bankName}
                          onChange={(e) => setPaymentData({...paymentData, bankName: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                          placeholder="Enter bank name"
                        />
                      </div>
                    )}

                    {paymentData.paymentMethod === 'cheque' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Cheque Number</label>
                        <input
                          type="text"
                          value={paymentData.chequeNo}
                          onChange={(e) => setPaymentData({...paymentData, chequeNo: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                          placeholder="Enter cheque number"
                        />
                      </div>
                    )}

                    {paymentData.paymentMethod === 'mobile' && (
                      <div>
                        <label className="block text-sm font-medium mb-1">Mobile Banking</label>
                        <select
                          value={paymentData.mobileBanking}
                          onChange={(e) => setPaymentData({...paymentData, mobileBanking: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                          }`}
                        >
                          <option value="">Select Provider</option>
                          <option value="bKash">bKash</option>
                          <option value="Nagad">Nagad</option>
                          <option value="Rocket">Rocket</option>
                          <option value="Upay">Upay</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-1">Notes</label>
                      <textarea
                        value={paymentData.notes}
                        onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                        className={`w-full px-3 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                        rows="2"
                        placeholder="Optional notes"
                      />
                    </div>

                    <button
                      onClick={handleAddPayment}
                      disabled={addingPayment || paymentData.amount <= 0}
                      className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingPayment ? 'Processing...' : 'Add Payment'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment History */}
            {sale.payments && sale.payments.length > 0 && (
              <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4">Payment History</h3>
                <div className="space-y-3">
                  {sale.payments.map((payment, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{formatDate(payment.paymentDate)}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payment.paymentMethod.toUpperCase()}
                            {payment.referenceNo && ` • ${payment.referenceNo}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatBDT(payment.amount)}</p>
                          <p className="text-xs text-gray-500">{payment.status}</p>
                        </div>
                      </div>
                      {payment.notes && (
                        <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate(`/sales/create?duplicate=${id}`)}
                  className="p-3 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 flex flex-col items-center"
                >
                  <FileText className="mb-2" size={20} />
                  <span className="text-sm">Duplicate</span>
                </button>
                <button
                  onClick={() => navigate('/sales/create')}
                  className="p-3 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50 flex flex-col items-center"
                >
                  <FileText className="mb-2" size={20} />
                  <span className="text-sm">New Sale</span>
                </button>
                <button
                  onClick={() => navigate(`/customers/${sale.customerId}`)}
                  className="p-3 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 flex flex-col items-center"
                >
                  <User className="mb-2" size={20} />
                  <span className="text-sm">Customer</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="p-3 rounded-lg bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 flex flex-col items-center"
                >
                  <Printer className="mb-2" size={20} />
                  <span className="text-sm">Print</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleDetails;