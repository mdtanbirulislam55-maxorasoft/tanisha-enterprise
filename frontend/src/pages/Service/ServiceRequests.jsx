import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { serviceAPI, customerAPI } from '../../services/api';
import {
  Wrench, Search, Filter, Download,
  Printer, Plus, RefreshCw, Save,
  CheckCircle, XCircle, Eye, Edit,
  Trash2, User, Clock, AlertTriangle,
  TrendingUp, Users, DollarSign, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const ServiceRequests = () => {
  const { theme } = useTheme();
  
  const [requests, setRequests] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    machineType: '',
    machineModel: '',
    serialNo: '',
    purchaseDate: '',
    problem: '',
    symptoms: '',
    serviceType: 'repair',
    priority: 'normal',
    estimatedCost: '',
    estimatedTime: '',
    assignedToId: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchCustomers();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await serviceAPI.getServiceRequests();
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      toast.error('Failed to load service requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers();
      if (response.success) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Failed to load customers');
    }
  };

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === parseInt(customerId));
    if (customer) {
      setFormData({
        ...formData,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.customerId || !formData.machineType || !formData.problem) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const requestData = {
        ...formData,
        customerId: parseInt(formData.customerId),
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
        purchaseDate: formData.purchaseDate || null
      };

      const response = await serviceAPI.createServiceRequest(requestData);
      
      if (response.success) {
        toast.success('Service request created successfully');
        setShowForm(false);
        resetForm();
        fetchRequests();
      }
    } catch (error) {
      toast.error('Failed to create service request');
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      machineType: '',
      machineModel: '',
      serialNo: '',
      purchaseDate: '',
      problem: '',
      symptoms: '',
      serviceType: 'repair',
      priority: 'normal',
      estimatedCost: '',
      estimatedTime: '',
      assignedToId: ''
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { color: 'text-green-600', bg: 'bg-green-500/20', icon: <CheckCircle size={14} /> };
      case 'in_progress':
        return { color: 'text-blue-600', bg: 'bg-blue-500/20', icon: <Clock size={14} /> };
      case 'assigned':
        return { color: 'text-yellow-600', bg: 'bg-yellow-500/20', icon: <User size={14} /> };
      case 'pending':
        return { color: 'text-red-600', bg: 'bg-red-500/20', icon: <AlertTriangle size={14} /> };
      case 'cancelled':
        return { color: 'text-gray-600', bg: 'bg-gray-500/20', icon: <XCircle size={14} /> };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-500/20', icon: null };
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent':
        return { color: 'text-red-600', bg: 'bg-red-500/20', text: 'Urgent' };
      case 'high':
        return { color: 'text-orange-600', bg: 'bg-orange-500/20', text: 'High' };
      case 'normal':
        return { color: 'text-yellow-600', bg: 'bg-yellow-500/20', text: 'Normal' };
      case 'low':
        return { color: 'text-green-600', bg: 'bg-green-500/20', text: 'Low' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-500/20', text: priority };
    }
  };

  const getServiceTypeBadge = (type) => {
    switch (type) {
      case 'repair':
        return { color: 'text-red-600', bg: 'bg-red-500/20', text: 'Repair' };
      case 'maintenance':
        return { color: 'text-blue-600', bg: 'bg-blue-500/20', text: 'Maintenance' };
      case 'installation':
        return { color: 'text-green-600', bg: 'bg-green-500/20', text: 'Installation' };
      case 'inspection':
        return { color: 'text-purple-600', bg: 'bg-purple-500/20', text: 'Inspection' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-500/20', text: type };
    }
  };

  const calculateStats = () => {
    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      inProgress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      urgent: requests.filter(r => r.priority === 'urgent').length,
      totalRevenue: requests.reduce((sum, r) => sum + (r.totalCharge || 0), 0),
      totalDue: requests.reduce((sum, r) => sum + (r.dueAmount || 0), 0)
    };
    return stats;
  };

  const filteredRequests = requests.filter(request => {
    if (search && !request.customerName.toLowerCase().includes(search.toLowerCase()) &&
        !request.requestNo.toLowerCase().includes(search.toLowerCase()) &&
        !request.machineType.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (statusFilter !== 'all' && request.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && request.priority !== priorityFilter) return false;
    return true;
  });

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Wrench className="mr-3" />
                Service Requests (সার্ভিস রিকুয়েস্ট)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Machinery Service Management
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Plus className="mr-2" size={18} />
                New Request
              </button>
              <button
                onClick={fetchRequests}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center"
              >
                <RefreshCw className="mr-2" size={18} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-xl p-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Requests
                </p>
                <p className="text-xl font-bold">{calculateStats().total}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
                <Wrench size={20} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Pending
                </p>
                <p className="text-xl font-bold text-yellow-600">{calculateStats().pending}</p>
              </div>
              <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-600">
                <Clock size={20} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  In Progress
                </p>
                <p className="text-xl font-bold text-blue-600">{calculateStats().inProgress}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
                <User size={20} />
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completed
                </p>
                <p className="text-xl font-bold text-green-600">{calculateStats().completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20 text-green-600">
                <CheckCircle size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Service Request Form */}
        {showForm && (
          <div className={`mb-6 rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Create Service Request</h2>
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
              {/* Customer Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <User className="mr-2" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Customer *</label>
                    <select
                      value={formData.customerId}
                      onChange={(e) => handleCustomerChange(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Select Customer</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} ({customer.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      readOnly
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="text"
                      value={formData.customerPhone}
                      readOnly
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Machine Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Wrench className="mr-2" />
                  Machine Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Machine Type *</label>
                    <select
                      value={formData.machineType}
                      onChange={(e) => setFormData({...formData, machineType: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Select Type</option>
                      <option value="Fogger Machine">Fogger Machine</option>
                      <option value="Grass Cutter">Grass Cutter</option>
                      <option value="Generator">Generator</option>
                      <option value="Water Pump">Water Pump</option>
                      <option value="Sprinkler System">Sprinkler System</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Model</label>
                    <input
                      type="text"
                      value={formData.machineModel}
                      onChange={(e) => setFormData({...formData, machineModel: e.target.value})}
                      placeholder="Machine model..."
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
                      value={formData.serialNo}
                      onChange={(e) => setFormData({...formData, serialNo: e.target.value})}
                      placeholder="Serial number..."
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Purchase Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                      <input
                        type="date"
                        value={formData.purchaseDate}
                        onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                        className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Problem Details */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Problem Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Problem Description *</label>
                    <textarea
                      value={formData.problem}
                      onChange={(e) => setFormData({...formData, problem: e.target.value})}
                      rows="3"
                      placeholder="Describe the problem..."
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Symptoms</label>
                    <textarea
                      value={formData.symptoms}
                      onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                      rows="2"
                      placeholder="Any specific symptoms..."
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-4">Service Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Service Type</label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => setFormData({...formData, serviceType: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="repair">Repair</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="installation">Installation</option>
                      <option value="inspection">Inspection</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Assigned To</label>
                    <select
                      value={formData.assignedToId}
                      onChange={(e) => setFormData({...formData, assignedToId: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <option value="">Not Assigned</option>
                      <option value="1">Technician 1</option>
                      <option value="2">Technician 2</option>
                      <option value="3">Technician 3</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Estimated Cost (৳)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.estimatedCost}
                      onChange={(e) => setFormData({...formData, estimatedCost: e.target.value})}
                      placeholder="Estimated cost..."
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Estimated Time</label>
                    <input
                      type="text"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({...formData, estimatedTime: e.target.value})}
                      placeholder="e.g., 2 hours, 1 day..."
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                </div>
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
                  Create Request
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search */}
        <div className={`mb-6 rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search requests by customer, request no, or machine..."
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
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="normal">Normal</option>
                <option value="low">Low</option>
              </select>

              <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center">
                <Filter className="mr-2" size={18} />
                More Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading service requests...</p>
          </div>
        ) : (
          <>
            {/* Service Requests Table */}
            <div className={`rounded-xl overflow-hidden mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className="text-left py-3 px-6">Request No</th>
                      <th className="text-left py-3 px-6">Customer</th>
                      <th className="text-left py-3 px-6">Machine</th>
                      <th className="text-left py-3 px-6">Service Type</th>
                      <th className="text-left py-3 px-6">Priority</th>
                      <th className="text-left py-3 px-6">Status</th>
                      <th className="text-left py-3 px-6">Est. Cost</th>
                      <th className="text-left py-3 px-6">Request Date</th>
                      <th className="text-left py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="py-8 text-center text-gray-500">
                          No service requests found
                        </td>
                      </tr>
                    ) : (
                      filteredRequests.map((request) => {
                        const statusBadge = getStatusBadge(request.status);
                        const priorityBadge = getPriorityBadge(request.priority);
                        const serviceTypeBadge = getServiceTypeBadge(request.serviceType);
                        
                        return (
                          <tr 
                            key={request.id}
                            className={`border-b ${
                              theme === 'dark' 
                                ? 'border-gray-700 hover:bg-gray-750' 
                                : 'border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-3 px-6">
                              <p className="font-bold">{request.requestNo}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {new Date(request.requestDate).toLocaleDateString()}
                              </p>
                            </td>
                            <td className="py-3 px-6">
                              <div>
                                <p className="font-medium">{request.customerName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {request.customerPhone}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-6">
                              <div>
                                <p className="font-medium">{request.machineType}</p>
                                {request.machineModel && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Model: {request.machineModel}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-6">
                              <span className={`px-2 py-1 rounded text-xs ${serviceTypeBadge.bg} ${serviceTypeBadge.color}`}>
                                {serviceTypeBadge.text}
                              </span>
                            </td>
                            <td className="py-3 px-6">
                              <span className={`px-2 py-1 rounded text-xs ${priorityBadge.bg} ${priorityBadge.color}`}>
                                {priorityBadge.text}
                              </span>
                            </td>
                            <td className="py-3 px-6">
                              <span className={`px-2 py-1 rounded text-xs ${statusBadge.bg} ${statusBadge.color} flex items-center`}>
                                {statusBadge.icon && <span className="mr-1">{statusBadge.icon}</span>}
                                {request.status}
                              </span>
                            </td>
                            <td className="py-3 px-6">
                              {request.estimatedCost ? (
                                <span className="font-bold text-green-600">
                                  {formatBDT(request.estimatedCost)}
                                </span>
                              ) : (
                                <span className="text-gray-500">Not estimated</span>
                              )}
                            </td>
                            <td className="py-3 px-6">
                              {new Date(request.requestDate).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-6">
                              <div className="flex items-center space-x-2">
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                  <Eye size={16} />
                                </button>
                                <button className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600">
                                  <Edit size={16} />
                                </button>
                                {request.status === 'pending' && (
                                  <button className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded text-green-600">
                                    <CheckCircle size={16} />
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

            {/* Revenue and Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Service Revenue
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBDT(calculateStats().totalRevenue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <DollarSign size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {calculateStats().total} requests
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Outstanding Due
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatBDT(calculateStats().totalDue)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-600">
                    <AlertTriangle size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Pending payments
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Urgent Requests
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {calculateStats().urgent}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-600">
                    <Clock size={24} />
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Need immediate attention
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ServiceRequests;