import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { accountsAPI } from '../../services/api';
import {
  Download, Printer, Calendar, Filter,
  TrendingUp, TrendingDown, DollarSign,
  FileText, CheckCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const TrialBalance = () => {
  const { theme } = useTheme();
  
  const [trialBalance, setTrialBalance] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchTrialBalance();
  }, [asOfDate]);

  const fetchTrialBalance = async () => {
    setLoading(true);
    try {
      const params = { asOfDate };
      const response = await accountsAPI.getTrialBalance(params);
      
      if (response.success) {
        setTrialBalance(response.data.trialBalance);
        setSummary(response.data.totals);
      }
    } catch (error) {
      toast.error('Failed to load trial balance');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    toast.info(`Exporting trial balance as ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  const handlePrint = () => {
    window.print();
  };

  const groupByType = () => {
    const groups = {};
    
    trialBalance.forEach(account => {
      if (!groups[account.type]) {
        groups[account.type] = [];
      }
      groups[account.type].push(account);
    });
    
    return groups;
  };

  const calculateTypeTotals = (accounts) => {
    return accounts.reduce((totals, account) => {
      totals.debit += account.debit;
      totals.credit += account.credit;
      return totals;
    }, { debit: 0, credit: 0 });
  };

  const isBalanced = summary.totalDebit === summary.totalCredit;

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <DollarSign className="mr-3" />
                Trial Balance (ট্রায়াল ব্যালেন্স)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - As of {asOfDate}
              </p>
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

        {/* Date Filter */}
        <div className={`mb-6 rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium mb-1">As of Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className={`pl-10 pr-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>
              <button
                onClick={() => setAsOfDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mt-6"
              >
                Today
              </button>
            </div>
            
            <div className={`px-4 py-2 rounded-full flex items-center ${
              isBalanced 
                ? 'bg-green-500/20 text-green-700' 
                : 'bg-red-500/20 text-red-700'
            }`}>
              {isBalanced ? (
                <>
                  <CheckCircle className="mr-2" size={16} />
                  Balanced
                </>
              ) : (
                <>
                  <XCircle className="mr-2" size={16} />
                  Unbalanced
                </>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading trial balance...</p>
          </div>
        ) : (
          <>
            {/* Trial Balance Table */}
            <div className={`rounded-xl overflow-hidden mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className="text-left py-3 px-6">Account</th>
                      <th className="text-left py-3 px-6">Type</th>
                      <th className="text-left py-3 px-6">Category</th>
                      <th className="text-left py-3 px-6">Debit (৳)</th>
                      <th className="text-left py-3 px-6">Credit (৳)</th>
                      <th className="text-left py-3 px-6">Balance (৳)</th>
                      <th className="text-left py-3 px-6">Balance Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupByType()).map(([type, accounts]) => {
                      const typeTotals = calculateTypeTotals(accounts);
                      
                      return (
                        <React.Fragment key={type}>
                          {/* Type Header */}
                          <tr className={`bg-gray-50 dark:bg-gray-750`}>
                            <td colSpan="7" className="py-3 px-6">
                              <div className="flex items-center">
                                {type === 'Asset' || type === 'Income' ? (
                                  <TrendingUp className="mr-2 text-green-600" />
                                ) : (
                                  <TrendingDown className="mr-2 text-red-600" />
                                )}
                                <span className="font-bold">{type}</span>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                                  ({accounts.length} accounts)
                                </span>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Accounts in this type */}
                          {accounts.map((account, index) => (
                            <tr 
                              key={account.id}
                              className={`border-b ${
                                theme === 'dark' 
                                  ? 'border-gray-700 hover:bg-gray-750' 
                                  : 'border-gray-100 hover:bg-gray-50'
                              }`}
                            >
                              <td className="py-3 px-6">
                                <div>
                                  <p className="font-medium">{account.name}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {account.code}
                                  </p>
                                </div>
                              </td>
                              <td className="py-3 px-6">
                                <span className="px-2 py-1 rounded text-xs bg-gray-100 dark:bg-gray-700">
                                  {account.type}
                                </span>
                              </td>
                              <td className="py-3 px-6">
                                <p className="text-sm">{account.category}</p>
                                {account.subCategory && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400">
                                    {account.subCategory}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-6">
                                {account.debit > 0 && (
                                  <span className="text-red-600 font-bold">
                                    {formatBDT(account.debit)}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-6">
                                {account.credit > 0 && (
                                  <span className="text-green-600 font-bold">
                                    {formatBDT(account.credit)}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-6">
                                <span className={`font-bold ${
                                  account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatBDT(account.balance)}
                                </span>
                              </td>
                              <td className="py-3 px-6">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  account.balanceType === 'Debit'
                                    ? 'bg-red-500/20 text-red-700'
                                    : 'bg-green-500/20 text-green-700'
                                }`}>
                                  {account.balanceType}
                                </span>
                              </td>
                            </tr>
                          ))}
                          
                          {/* Type Totals */}
                          <tr className={`bg-gray-50 dark:bg-gray-750 font-bold`}>
                            <td colSpan="3" className="py-3 px-6 text-right">
                              {type} Total:
                            </td>
                            <td className="py-3 px-6">
                              <span className="text-red-600">{formatBDT(typeTotals.debit)}</span>
                            </td>
                            <td className="py-3 px-6">
                              <span className="text-green-600">{formatBDT(typeTotals.credit)}</span>
                            </td>
                            <td colSpan="2" className="py-3 px-6">
                              <span className={`${
                                typeTotals.debit - typeTotals.credit >= 0 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }`}>
                                {formatBDT(typeTotals.debit - typeTotals.credit)}
                              </span>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}
                    
                    {/* Grand Totals */}
                    <tr className={`bg-gray-100 dark:bg-gray-700 font-bold`}>
                      <td colSpan="3" className="py-3 px-6 text-right">
                        GRAND TOTAL:
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-red-600 text-lg">{formatBDT(summary.totalDebit || 0)}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-green-600 text-lg">{formatBDT(summary.totalCredit || 0)}</span>
                      </td>
                      <td colSpan="2" className="py-3 px-6">
                        <span className={`text-lg ${
                          isBalanced ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatBDT((summary.totalDebit || 0) - (summary.totalCredit || 0))}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Debit
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatBDT(summary.totalDebit || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-600">
                    <TrendingDown size={24} />
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Credit
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBDT(summary.totalCredit || 0)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Difference
                    </p>
                    <p className={`text-2xl font-bold ${
                      isBalanced ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatBDT((summary.totalDebit || 0) - (summary.totalCredit || 0))}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    isBalanced ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                  }`}>
                    {isBalanced ? <CheckCircle size={24} /> : <XCircle size={24} />}
                  </div>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Accounts
                    </p>
                    <p className="text-2xl font-bold">{trialBalance.length}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-600">
                    <FileText size={24} />
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

export default TrialBalance;