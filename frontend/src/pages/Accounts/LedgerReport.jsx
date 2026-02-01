import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { accountsAPI } from '../../services/api';
import {
  Search, Filter, Download, Printer, Calendar,
  ArrowLeft, FileText, TrendingUp, TrendingDown,
  DollarSign, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';
import { formatDate } from '../../utils/bengaliDate';

const LedgerReport = () => {
  const { theme } = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [account, setAccount] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(id || '');
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchAccounts();
    if (id) {
      fetchLedgerData();
    }
  }, [id, filters]);

  const fetchAccounts = async () => {
    try {
      const response = await accountsAPI.getAccountHeads({ limit: 500 });
      if (response.success) {
        setAccounts(response.data.accountHeads);
      }
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const fetchLedgerData = async () => {
    if (!selectedAccountId) return;
    
    setLoading(true);
    try {
      const params = {
        accountId: selectedAccountId,
        ...filters
      };
      
      const response = await accountsAPI.getLedgerReport(params);
      if (response.success) {
        setAccount(response.data.account);
        setLedger(response.data.entries);
        setSummary({
          openingBalance: response.data.openingBalance,
          closingBalance: response.data.closingBalance,
          totalDebit: response.data.totalDebit,
          totalCredit: response.data.totalCredit
        });
      }
    } catch (error) {
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (accountId) => {
    setSelectedAccountId(accountId);
    if (accountId) {
      navigate(`/accounts/ledger/${accountId}`);
    }
  };

  const handleExport = (format) => {
    toast.info(`Exporting ledger as ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  const handlePrint = () => {
    window.print();
  };

  const getTransactionType = (entry, accountId) => {
    if (entry.debitAccountId === parseInt(accountId)) {
      return {
        type: 'Debit',
        amount: entry.debitAmount,
        relatedAccount: entry.creditAccount
      };
    } else {
      return {
        type: 'Credit',
        amount: entry.creditAmount,
        relatedAccount: entry.debitAccount
      };
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/accounts')}
                className="p-2 mr-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Ledger Report (খতিয়ান রিপোর্ট)</h1>
                <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tanisha Enterprise - Account Ledger
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleExport('pdf')}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-700 hover:bg-red-500/30 flex items-center"
              >
                <Download className="mr-2" size={18} />
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Printer className="mr-2" size={18} />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Account Selection & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4">Select Account</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <select
                value={selectedAccountId}
                onChange={(e) => handleAccountChange(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">Select an account...</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
            
            {account && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{account.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {account.code} • {account.type} • {account.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Current Balance</p>
                    <p className={`text-xl font-bold ${
                      account.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatBDT(account.currentBalance || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4">Date Range</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              <button
                onClick={() => setFilters({ startDate: '', endDate: '' })}
                className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
              >
                Clear Dates
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Opening Balance</span>
                <span className={`font-bold ${
                  summary.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatBDT(summary.openingBalance || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Debit</span>
                <span className="font-bold text-red-600">{formatBDT(summary.totalDebit || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Credit</span>
                <span className="font-bold text-green-600">{formatBDT(summary.totalCredit || 0)}</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Closing Balance</span>
                  <span className={`${
                    summary.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatBDT(summary.closingBalance || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading ledger data...</p>
          </div>
        ) : account ? (
          <div className={`rounded-xl overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Ledger Header */}
            <div className="p-6 border-b border-gray-700 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{account.name} - Ledger</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Account Code: {account.code} | Type: {account.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Report Period</p>
                  <p className="font-medium">
                    {filters.startDate || 'Beginning'} to {filters.endDate || 'Today'}
                  </p>
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <th className="text-left py-3 px-6">Date</th>
                    <th className="text-left py-3 px-6">Voucher</th>
                    <th className="text-left py-3 px-6">Particulars</th>
                    <th className="text-left py-3 px-6">Debit</th>
                    <th className="text-left py-3 px-6">Credit</th>
                    <th className="text-left py-3 px-6">Balance</th>
                    <th className="text-left py-3 px-6">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Opening Balance Row */}
                  <tr className={`border-b ${
                    theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <td className="py-3 px-6">
                      {filters.startDate || 'Opening'}
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                        Opening
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <div>
                        <p className="font-medium">Opening Balance</p>
                      </div>
                    </td>
                    <td className="py-3 px-6">
                      {summary.openingBalance > 0 ? (
                        <span className="text-red-600 font-bold">
                          {formatBDT(summary.openingBalance)}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-6">
                      {summary.openingBalance < 0 ? (
                        <span className="text-green-600 font-bold">
                          {formatBDT(Math.abs(summary.openingBalance))}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`font-bold ${
                        summary.openingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatBDT(summary.openingBalance || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                        Opening
                      </span>
                    </td>
                  </tr>

                  {/* Ledger Entries */}
                  {ledger.map((entry, index) => {
                    const trans = getTransactionType(entry, selectedAccountId);
                    
                    return (
                      <tr 
                        key={index}
                        className={`border-b ${
                          theme === 'dark' 
                            ? 'border-gray-700 hover:bg-gray-750' 
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <td className="py-3 px-6">
                          {formatDate(entry.entryDate)}
                        </td>
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-medium">{entry.voucherNo}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {entry.voucherType}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div>
                            <p className="font-medium">
                              {trans.relatedAccount?.name || 'Unknown Account'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {trans.type === 'Debit' ? 'To' : 'By'} {trans.relatedAccount?.code || 'N/A'}
                            </p>
                            {entry.debitNarration || entry.creditNarration ? (
                              <p className="text-xs text-gray-500 mt-1">
                                {trans.type === 'Debit' ? entry.debitNarration : entry.creditNarration}
                              </p>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          {trans.type === 'Debit' ? (
                            <span className="text-red-600 font-bold">
                              {formatBDT(trans.amount)}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 px-6">
                          {trans.type === 'Credit' ? (
                            <span className="text-green-600 font-bold">
                              {formatBDT(trans.amount)}
                            </span>
                          ) : null}
                        </td>
                        <td className="py-3 px-6">
                          <span className={`font-bold ${
                            entry.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatBDT(entry.balance || 0)}
                          </span>
                        </td>
                        <td className="py-3 px-6">
                          <span className={`px-2 py-1 rounded text-xs ${
                            trans.type === 'Debit' 
                              ? 'bg-red-500/20 text-red-700' 
                              : 'bg-green-500/20 text-green-700'
                          }`}>
                            {trans.type}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Closing Balance Row */}
                  <tr className={`bg-gray-50 dark:bg-gray-750`}>
                    <td className="py-3 px-6 font-bold">
                      {filters.endDate || 'Closing'}
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                        Closing
                      </span>
                    </td>
                    <td className="py-3 px-6 font-bold">Closing Balance</td>
                    <td className="py-3 px-6">
                      <span className="font-bold text-red-600">
                        {formatBDT(summary.totalDebit || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="font-bold text-green-600">
                        {formatBDT(summary.totalCredit || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`text-xl font-bold ${
                        summary.closingBalance >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatBDT(summary.closingBalance || 0)}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                        Closing
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Summary Footer */}
            <div className="p-6 border-t border-gray-700 dark:border-gray-600">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Debit</p>
                    <p className="text-xl font-bold text-red-600">
                      {formatBDT(summary.totalDebit || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Credit</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatBDT(summary.totalCredit || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Net Balance</p>
                    <p className="text-xl font-bold">
                      {formatBDT((summary.totalDebit || 0) - (summary.totalCredit || 0))}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Entries Count</p>
                  <p className="text-xl font-bold">{ledger.length}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl p-12 text-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Account Selected</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Please select an account from the dropdown to view its ledger
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LedgerReport;