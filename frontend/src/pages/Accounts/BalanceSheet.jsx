import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { accountsAPI } from '../../services/api';
import { Scale as Balance, Building, TrendingUp, TrendingDown,
  Download, Printer, Calendar, Filter,
  ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const BalanceSheet = () => {
  const { theme } = useTheme();
  
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    assets: true,
    liabilities: true,
    equity: true
  });
  
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchBalanceSheet();
  }, [asOfDate]);

  const fetchBalanceSheet = async () => {
    setLoading(true);
    try {
      const params = { asOfDate };
      const response = await accountsAPI.getBalanceSheet(params);
      
      if (response.success) {
        setBalanceSheet(response.data);
      }
    } catch (error) {
      toast.error('Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExport = (format) => {
    toast.info(`Exporting balance sheet as ${format.toUpperCase()}...`);
  };

  const handlePrint = () => {
    window.print();
  };

  const isBalanced = balanceSheet?.totals?.balanceCheck;

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Balance className="mr-3" />
                Balance Sheet (ভারসাম্য বিবরণী)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Financial Position as of {new Date(asOfDate).toLocaleDateString()}
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
            
            {balanceSheet && (
              <div className={`px-4 py-2 rounded-full flex items-center ${
                isBalanced 
                  ? 'bg-green-500/20 text-green-700' 
                  : 'bg-red-500/20 text-red-700'
              }`}>
                {isBalanced ? '✓ Balanced' : '✗ Unbalanced'}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading balance sheet...</p>
          </div>
        ) : balanceSheet ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assets Side */}
            <div className={`rounded-xl overflow-hidden ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div 
                className="p-6 border-b border-gray-700 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                onClick={() => toggleSection('assets')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {expandedSections.assets ? <ChevronDown className="mr-3" /> : <ChevronRight className="mr-3" />}
                    <h2 className="text-xl font-bold flex items-center text-green-600">
                      <TrendingUp className="mr-2" />
                      Assets (সম্পত্তি)
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {formatBDT(balanceSheet.assets.total)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {balanceSheet.assets.byCategory.length} categories
                    </p>
                  </div>
                </div>
              </div>
              
              {expandedSections.assets && (
                <div className="p-6">
                  {/* Assets by Category */}
                  {balanceSheet.assets.byCategory.map((category, index) => (
                    <div key={index} className="mb-6 last:mb-0">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-green-700">{category.category}</h3>
                        <span className="font-bold">{formatBDT(category.total)}</span>
                      </div>
                      
                      <div className="space-y-2">
                        {category.accounts.map((account, idx) => (
                          <div 
                            key={idx}
                            className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
                          >
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {account.code}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {formatBDT(account.balance)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {/* Assets Total */}
                  <div className="mt-6 pt-6 border-t border-gray-700 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Total Assets</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatBDT(balanceSheet.assets.total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Liabilities & Equity Side */}
            <div className="space-y-6">
              {/* Liabilities */}
              <div className={`rounded-xl overflow-hidden ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div 
                  className="p-6 border-b border-gray-700 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                  onClick={() => toggleSection('liabilities')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedSections.liabilities ? <ChevronDown className="mr-3" /> : <ChevronRight className="mr-3" />}
                      <h2 className="text-xl font-bold flex items-center text-red-600">
                        <TrendingDown className="mr-2" />
                        Liabilities (দায়)
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">
                        {formatBDT(balanceSheet.liabilities.total)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {balanceSheet.liabilities.byCategory.length} categories
                      </p>
                    </div>
                  </div>
                </div>
                
                {expandedSections.liabilities && (
                  <div className="p-6">
                    {/* Liabilities by Category */}
                    {balanceSheet.liabilities.byCategory.map((category, index) => (
                      <div key={index} className="mb-6 last:mb-0">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-red-700">{category.category}</h3>
                          <span className="font-bold">{formatBDT(category.total)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {category.accounts.map((account, idx) => (
                            <div 
                              key={idx}
                              className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
                            >
                              <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {account.code}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-red-600">
                                  {formatBDT(account.balance)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Liabilities Total */}
                    <div className="mt-6 pt-6 border-t border-gray-700 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Total Liabilities</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-red-600">
                            {formatBDT(balanceSheet.liabilities.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Equity */}
              <div className={`rounded-xl overflow-hidden ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div 
                  className="p-6 border-b border-gray-700 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                  onClick={() => toggleSection('equity')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedSections.equity ? <ChevronDown className="mr-3" /> : <ChevronRight className="mr-3" />}
                      <h2 className="text-xl font-bold flex items-center text-blue-600">
                        <Building className="mr-2" />
                        Equity (মালিকানা স্বত্ব)
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {formatBDT(balanceSheet.equity.total)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {balanceSheet.equity.byCategory.length} categories
                      </p>
                    </div>
                  </div>
                </div>
                
                {expandedSections.equity && (
                  <div className="p-6">
                    {/* Equity by Category */}
                    {balanceSheet.equity.byCategory.map((category, index) => (
                      <div key={index} className="mb-6 last:mb-0">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-blue-700">{category.category}</h3>
                          <span className="font-bold">{formatBDT(category.total)}</span>
                        </div>
                        
                        <div className="space-y-2">
                          {category.accounts.map((account, idx) => (
                            <div 
                              key={idx}
                              className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750"
                            >
                              <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {account.code}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-blue-600">
                                  {formatBDT(account.balance)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    
                    {/* Equity Total */}
                    <div className="mt-6 pt-6 border-t border-gray-700 dark:border-gray-600">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Total Equity</h3>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {formatBDT(balanceSheet.equity.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Balance Summary */}
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4">Balance Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Assets</span>
                    <span className="font-bold text-green-600">
                      {formatBDT(balanceSheet.assets.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Liabilities</span>
                    <span className="font-bold text-red-600">
                      {formatBDT(balanceSheet.liabilities.total)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Equity</span>
                    <span className="font-bold text-blue-600">
                      {formatBDT(balanceSheet.equity.total)}
                    </span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Liabilities + Equity</span>
                      <span className={
                        isBalanced ? 'text-green-600' : 'text-red-600'
                      }>
                        {formatBDT(balanceSheet.liabilities.total + balanceSheet.equity.total)}
                      </span>
                    </div>
                  </div>
                  <div className={`mt-4 p-3 rounded-lg ${
                    isBalanced 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-center">
                      {isBalanced ? (
                        <>
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="font-bold">
                            Assets = Liabilities + Equity ({formatBDT(balanceSheet.assets.total)})
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                          <span className="font-bold">
                            Unbalanced! Difference: {formatBDT(
                              balanceSheet.assets.total - (balanceSheet.liabilities.total + balanceSheet.equity.total)
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`rounded-xl p-12 text-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <Balance className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Balance Sheet</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No balance sheet data available for the selected date
            </p>
            <button
              onClick={fetchBalanceSheet}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Load Balance Sheet
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalanceSheet;