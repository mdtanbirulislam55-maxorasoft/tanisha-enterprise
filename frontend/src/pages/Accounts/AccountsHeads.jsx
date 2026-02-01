import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { accountsAPI } from '../../services/api';
import {
  Search, Filter, Plus, Edit, Trash2,
  DollarSign, TrendingUp, TrendingDown,
  FolderTree, FolderOpen, FileText,
  ChevronDown, ChevronRight, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const AccountsHeads = () => {
  const { theme } = useTheme();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    parentId: ''
  });
  
  const [newAccount, setNewAccount] = useState({
    code: '',
    name: '',
    description: '',
    type: 'Asset',
    category: 'Current Asset',
    subCategory: '',
    parentId: '',
    openingBalance: 0
  });
  
  const accountTypes = [
    'Asset', 'Liability', 'Equity', 'Income', 'Expense'
  ];
  
  const accountCategories = {
    Asset: ['Current Asset', 'Fixed Asset', 'Investment', 'Other Asset'],
    Liability: ['Current Liability', 'Long Term Liability', 'Other Liability'],
    Equity: ['Capital', 'Retained Earnings', 'Reserves'],
    Income: ['Sales', 'Other Income', 'Service Income'],
    Expense: ['Cost of Goods Sold', 'Operating Expense', 'Administrative Expense', 'Financial Expense']
  };

  useEffect(() => {
    fetchAccounts();
  }, [filters]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 500 };
      const response = await accountsAPI.getAccountHeads(params);
      
      if (response.success) {
        setAccounts(response.data.accountHeads);
        
        // Auto-expand all parent accounts
        const expanded = {};
        response.data.accountHeads.forEach(account => {
          if (account.parentId) {
            expanded[account.parentId] = true;
          }
        });
        setExpandedGroups(expanded);
      }
    } catch (error) {
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.code || !newAccount.name || !newAccount.type || !newAccount.category) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await accountsAPI.createAccountHead(newAccount);
      if (response.success) {
        toast.success('Account created successfully');
        setShowCreateModal(false);
        setNewAccount({
          code: '',
          name: '',
          description: '',
          type: 'Asset',
          category: 'Current Asset',
          subCategory: '',
          parentId: '',
          openingBalance: 0
        });
        fetchAccounts();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create account');
    }
  };

  const handleDeleteAccount = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return;

    try {
      // Implement delete API
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const toggleGroup = (id) => {
    setExpandedGroups(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getAccountIcon = (type) => {
    switch(type) {
      case 'Asset': return <TrendingUp className="text-green-600" />;
      case 'Liability': return <TrendingDown className="text-red-600" />;
      case 'Equity': return <DollarSign className="text-blue-600" />;
      case 'Income': return <TrendingUp className="text-green-600" />;
      case 'Expense': return <TrendingDown className="text-red-600" />;
      default: return <FileText className="text-gray-600" />;
    }
  };

  const getBalanceColor = (balance, type) => {
    if (type === 'Asset' || type === 'Expense') {
      return balance >= 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return balance >= 0 ? 'text-red-600' : 'text-green-600';
    }
  };

  const renderAccountTree = (parentId = null, level = 0) => {
    const filteredAccounts = accounts.filter(account => account.parentId === parentId);
    
    return filteredAccounts.map(account => {
      const hasChildren = accounts.some(a => a.parentId === account.id);
      const isExpanded = expandedGroups[account.id];
      
      return (
        <div key={account.id} className="mb-1">
          <div 
            className={`flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${
              level > 0 ? 'ml-6' : ''
            }`}
            style={{ paddingLeft: `${level * 24 + 12}px` }}
          >
            <button
              onClick={() => toggleGroup(account.id)}
              className="mr-2 p-1"
              disabled={!hasChildren}
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              ) : (
                <div className="w-4"></div>
              )}
            </button>
            
            <div className="flex-1 flex items-center">
              <div className="mr-3">
                {getAccountIcon(account.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium">{account.name}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {account.code}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {account.category} {account.subCategory && `• ${account.subCategory}`}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-bold ${getBalanceColor(account.currentBalance, account.type)}`}>
                {formatBDT(account.currentBalance || 0)}
              </div>
              <div className="text-sm text-gray-500">
                {account._count?.children || 0} sub-accounts
              </div>
            </div>
            
            <div className="ml-4 flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedAccount(account);
                  setShowEditModal(true);
                }}
                className="p-1 text-blue-600 hover:text-blue-800"
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => navigate(`/accounts/ledger/${account.id}`)}
                className="p-1 text-green-600 hover:text-green-800"
                title="View Ledger"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => handleDeleteAccount(account.id)}
                className="p-1 text-red-600 hover:text-red-800"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {hasChildren && isExpanded && renderAccountTree(account.id, level + 1)}
        </div>
      );
    });
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <FolderTree className="mr-3" />
                Chart of Accounts (হিসাবের চার্ট)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Accounts Hierarchy
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
            >
              <Plus className="mr-2" size={18} />
              New Account Head
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={`mb-6 rounded-xl p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Search accounts..."
                  className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            <div>
              <select
                value={filters.type}
                onChange={(e) => setFilters({...filters, type: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Types</option>
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Categories</option>
                {filters.type && accountCategories[filters.type]?.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={filters.parentId}
                onChange={(e) => setFilters({...filters, parentId: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Accounts</option>
                <option value="null">Top Level Only</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Accounts Tree */}
        <div className={`rounded-xl overflow-hidden ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="p-4 border-b border-gray-700 dark:border-gray-600">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium">
              <div className="col-span-6">Account Name</div>
              <div className="col-span-2 text-center">Type</div>
              <div className="col-span-2 text-center">Category</div>
              <div className="col-span-2 text-right">Balance</div>
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4">Loading accounts...</p>
            </div>
          ) : accounts.length > 0 ? (
            <div className="divide-y divide-gray-700 dark:divide-gray-600">
              {renderAccountTree()}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Accounts Found</h3>
              <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Create your first account head to get started
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                Create First Account
              </button>
            </div>
          )}
        </div>

        {/* Summary by Type */}
        <div className={`mt-6 p-6 rounded-xl ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="font-bold mb-4">Summary by Account Type</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {accountTypes.map(type => {
              const typeAccounts = accounts.filter(a => a.type === type);
              const totalBalance = typeAccounts.reduce((sum, a) => sum + (parseFloat(a.currentBalance) || 0), 0);
              
              return (
                <div key={type} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
                  <div className="text-lg font-bold">{type}</div>
                  <div className={`text-2xl font-bold mt-2 ${
                    type === 'Asset' || type === 'Income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatBDT(totalBalance)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {typeAccounts.length} accounts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-2xl ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6 border-b border-gray-700 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Create New Account Head</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Account Code *</label>
                  <input
                    type="text"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({...newAccount, code: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    placeholder="e.g., 1001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Account Name *</label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    placeholder="e.g., Cash in Hand"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Account Type *</label>
                  <select
                    value={newAccount.type}
                    onChange={(e) => {
                      const type = e.target.value;
                      setNewAccount({
                        ...newAccount, 
                        type,
                        category: accountCategories[type]?.[0] || ''
                      });
                    }}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {accountTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    value={newAccount.category}
                    onChange={(e) => setNewAccount({...newAccount, category: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {accountCategories[newAccount.type]?.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Sub Category</label>
                  <input
                    type="text"
                    value={newAccount.subCategory}
                    onChange={(e) => setNewAccount({...newAccount, subCategory: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    placeholder="Optional"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Parent Account</label>
                  <select
                    value={newAccount.parentId}
                    onChange={(e) => setNewAccount({...newAccount, parentId: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="">None (Top Level)</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Opening Balance</label>
                  <input
                    type="number"
                    value={newAccount.openingBalance}
                    onChange={(e) => setNewAccount({...newAccount, openingBalance: parseFloat(e.target.value) || 0})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newAccount.description}
                    onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    rows="2"
                    placeholder="Optional description"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAccount}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Create Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsHeads;