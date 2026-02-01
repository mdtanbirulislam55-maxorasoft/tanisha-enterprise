import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { accountsAPI } from '../../services/api';
import {
  Plus, Minus, Save, X, RefreshCw,
  Calculator, FileText, Calendar, Search,
  ArrowRightLeft, DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const JournalEntry = () => {
  const { theme } = useTheme();
  
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchDebit, setSearchDebit] = useState('');
  const [searchCredit, setSearchCredit] = useState('');
  
  const [journalData, setJournalData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    voucherType: 'Journal',
    debitAccountId: '',
    debitAmount: 0,
    debitNarration: '',
    creditAccountId: '',
    creditAmount: 0,
    creditNarration: '',
    referenceNo: '',
    referenceType: '',
    referenceId: ''
  });
  
  const [filteredDebitAccounts, setFilteredDebitAccounts] = useState([]);
  const [filteredCreditAccounts, setFilteredCreditAccounts] = useState([]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    filterAccounts(searchDebit, 'debit');
  }, [searchDebit, accounts]);

  useEffect(() => {
    filterAccounts(searchCredit, 'credit');
  }, [searchCredit, accounts]);

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.getAccountHeads({ limit: 500 });
      if (response.success) {
        setAccounts(response.data.accountHeads);
        setFilteredDebitAccounts(response.data.accountHeads);
        setFilteredCreditAccounts(response.data.accountHeads);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const filterAccounts = (searchTerm, type) => {
    if (!searchTerm) {
      if (type === 'debit') {
        setFilteredDebitAccounts(accounts);
      } else {
        setFilteredCreditAccounts(accounts);
      }
      return;
    }

    const filtered = accounts.filter(account =>
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (type === 'debit') {
      setFilteredDebitAccounts(filtered);
    } else {
      setFilteredCreditAccounts(filtered);
    }
  };

  const handleAccountSelect = (account, type) => {
    if (type === 'debit') {
      setJournalData({
        ...journalData,
        debitAccountId: account.id,
        debitNarration: journalData.debitNarration || `Dr. ${account.name}`
      });
      setSearchDebit('');
    } else {
      setJournalData({
        ...journalData,
        creditAccountId: account.id,
        creditNarration: journalData.creditNarration || `Cr. ${account.name}`
      });
      setSearchCredit('');
    }
  };

  const handleAmountChange = (type, value) => {
    const amount = parseFloat(value) || 0;
    
    if (type === 'debit') {
      setJournalData({
        ...journalData,
        debitAmount: amount,
        creditAmount: amount // Auto-match credit amount
      });
    } else {
      setJournalData({
        ...journalData,
        creditAmount: amount,
        debitAmount: amount // Auto-match debit amount
      });
    }
  };

  const handleSwapAccounts = () => {
    setJournalData({
      ...journalData,
      debitAccountId: journalData.creditAccountId,
      creditAccountId: journalData.debitAccountId,
      debitAmount: journalData.creditAmount,
      creditAmount: journalData.debitAmount,
      debitNarration: journalData.creditNarration,
      creditNarration: journalData.debitNarration
    });
  };

  const validateForm = () => {
    if (!journalData.debitAccountId || !journalData.creditAccountId) {
      toast.error('Please select both debit and credit accounts');
      return false;
    }

    if (journalData.debitAccountId === journalData.creditAccountId) {
      toast.error('Debit and credit accounts cannot be the same');
      return false;
    }

    if (!journalData.debitAmount || journalData.debitAmount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }

    if (journalData.debitAmount !== journalData.creditAmount) {
      toast.error('Debit and credit amounts must be equal');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await accountsAPI.createJournalEntry(journalData);
      if (response.success) {
        toast.success('Journal entry created successfully');
        
        // Reset form
        setJournalData({
          entryDate: new Date().toISOString().split('T')[0],
          voucherType: 'Journal',
          debitAccountId: '',
          debitAmount: 0,
          debitNarration: '',
          creditAccountId: '',
          creditAmount: 0,
          creditNarration: '',
          referenceNo: '',
          referenceType: '',
          referenceId: ''
        });
        setSearchDebit('');
        setSearchCredit('');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create journal entry');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedAccount = (id, type) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return null;
    
    return (
      <div className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="font-bold">{account.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {account.code} • {account.category}
            </p>
            <p className={`text-sm font-medium mt-1 ${
              type === 'debit' ? 'text-red-600' : 'text-green-600'
            }`}>
              Current Balance: {formatBDT(account.currentBalance || 0)}
            </p>
          </div>
          <button
            onClick={() => {
              if (type === 'debit') {
                setJournalData({...journalData, debitAccountId: ''});
              } else {
                setJournalData({...journalData, creditAccountId: ''});
              }
            }}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <ArrowRightLeft className="mr-3" />
                Journal Entry (জার্নাল এন্ট্রি)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Manual Journal Entries
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
              >
                Print Preview
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2" size={18} />
                    Save Journal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Debit Side */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center text-red-600">
                <Minus className="mr-2" />
                Debit (ডেবিট)
              </h2>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatBDT(journalData.debitAmount)}
                </p>
              </div>
            </div>

            {/* Account Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Debit Account *</label>
              
              {journalData.debitAccountId ? (
                getSelectedAccount(journalData.debitAccountId, 'debit')
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchDebit}
                      onChange={(e) => setSearchDebit(e.target.value)}
                      placeholder="Search debit account..."
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  
                  {filteredDebitAccounts.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {filteredDebitAccounts.map(account => (
                        <div
                          key={account.id}
                          onClick={() => handleAccountSelect(account, 'debit')}
                          className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {account.code} • {account.type} • {account.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatBDT(account.currentBalance || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No accounts found</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  value={journalData.debitAmount}
                  onChange={(e) => handleAmountChange('debit', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Narration */}
            <div>
              <label className="block text-sm font-medium mb-2">Narration</label>
              <textarea
                value={journalData.debitNarration}
                onChange={(e) => setJournalData({...journalData, debitNarration: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
                rows="3"
                placeholder="Enter debit narration..."
              />
            </div>
          </div>

          {/* Credit Side */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center text-green-600">
                <Plus className="mr-2" />
                Credit (ক্রেডিট)
              </h2>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatBDT(journalData.creditAmount)}
                </p>
              </div>
            </div>

            {/* Account Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Credit Account *</label>
              
              {journalData.creditAccountId ? (
                getSelectedAccount(journalData.creditAccountId, 'credit')
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchCredit}
                      onChange={(e) => setSearchCredit(e.target.value)}
                      placeholder="Search credit account..."
                      className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  
                  {filteredCreditAccounts.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCreditAccounts.map(account => (
                        <div
                          key={account.id}
                          onClick={() => handleAccountSelect(account, 'credit')}
                          className={`p-3 mb-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border ${
                            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {account.code} • {account.type} • {account.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-medium ${
                                account.currentBalance >= 0 ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {formatBDT(account.currentBalance || 0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No accounts found</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Amount *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  value={journalData.creditAmount}
                  onChange={(e) => handleAmountChange('credit', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Narration */}
            <div>
              <label className="block text-sm font-medium mb-2">Narration</label>
              <textarea
                value={journalData.creditNarration}
                onChange={(e) => setJournalData({...journalData, creditNarration: e.target.value})}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
                rows="3"
                placeholder="Enter credit narration..."
              />
            </div>
          </div>
        </div>

        {/* Middle Section - Swap & Details */}
        <div className="mt-8 mb-8 relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 top-1/2 -translate-y-1/2 z-10">
            <button
              onClick={handleSwapAccounts}
              className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
              title="Swap Debit/Credit"
            >
              <RefreshCw size={24} />
            </button>
          </div>
          
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Entry Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Entry Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={journalData.entryDate}
                    onChange={(e) => setJournalData({...journalData, entryDate: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              
              {/* Voucher Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Voucher Type</label>
                <select
                  value={journalData.voucherType}
                  onChange={(e) => setJournalData({...journalData, voucherType: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="Journal">Journal</option>
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                  <option value="Contra">Contra</option>
                  <option value="Adjustment">Adjustment</option>
                </select>
              </div>
              
              {/* Reference No */}
              <div>
                <label className="block text-sm font-medium mb-2">Reference No</label>
                <input
                  type="text"
                  value={journalData.referenceNo}
                  onChange={(e) => setJournalData({...journalData, referenceNo: e.target.value})}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                  placeholder="Optional reference number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary & Actions */}
        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-2">Journal Summary</h3>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Debit Total</p>
                  <p className="text-xl font-bold text-red-600">{formatBDT(journalData.debitAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Credit Total</p>
                  <p className="text-xl font-bold text-green-600">{formatBDT(journalData.creditAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Difference</p>
                  <p className={`text-xl font-bold ${
                    journalData.debitAmount === journalData.creditAmount 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {formatBDT(journalData.debitAmount - journalData.creditAmount)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`mb-2 px-3 py-1 rounded-full inline-block ${
                journalData.debitAmount === journalData.creditAmount 
                  ? 'bg-green-500/20 text-green-700' 
                  : 'bg-red-500/20 text-red-700'
              }`}>
                {journalData.debitAmount === journalData.creditAmount 
                  ? '✓ Balanced' 
                  : '✗ Unbalanced'}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Both sides must be equal
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-700 dark:border-gray-600 flex justify-end space-x-3">
            <button
              onClick={() => {
                setJournalData({
                  entryDate: new Date().toISOString().split('T')[0],
                  voucherType: 'Journal',
                  debitAccountId: '',
                  debitAmount: 0,
                  debitNarration: '',
                  creditAccountId: '',
                  creditAmount: 0,
                  creditNarration: '',
                  referenceNo: '',
                  referenceType: '',
                  referenceId: ''
                });
                setSearchDebit('');
                setSearchCredit('');
              }}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Clear All
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || journalData.debitAmount !== journalData.creditAmount}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="mr-2" size={18} />
                  Save Journal Entry
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalEntry;