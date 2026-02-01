import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { accountsAPI } from '../../services/api';
import {
  Download, Printer, Calendar, Filter,
  TrendingUp, TrendingDown, DollarSign,
  PieChart, BarChart3, FileText,
  ChevronDown, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatBDT } from '../../utils/bdtFormatter';

const ProfitLoss = () => {
  const { theme } = useTheme();
  
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({
    income: true,
    expenses: true
  });
  
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProfitLoss();
  }, [filters]);

  const fetchProfitLoss = async () => {
    setLoading(true);
    try {
      const response = await accountsAPI.getProfitLoss(filters);
      
      if (response.success) {
        setReport(response.data);
      }
    } catch (error) {
      toast.error('Failed to load profit & loss report');
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
    toast.info(`Exporting P&L as ${format.toUpperCase()}...`);
    // Implement export functionality
  };

  const handlePrint = () => {
    window.print();
  };

  const calculatePercentage = (amount, total) => {
    if (total === 0) return 0;
    return ((amount / total) * 100).toFixed(1);
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <TrendingUp className="mr-3" />
                Profit & Loss Statement (লাভ-ক্ষতি বিবরণী)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - For the period {filters.startDate} to {filters.endDate}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <div className="flex items-end space-x-2">
              <button
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  setFilters({
                    startDate: firstDay.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg flex-1"
              >
                This Month
              </button>
              <button
                onClick={fetchProfitLoss}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg flex-1"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading profit & loss report...</p>
          </div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Income
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatBDT(report.income.total)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/20 text-green-600">
                    <TrendingUp size={24} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.income.details.length} income accounts
                  </p>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Expenses
                    </p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatBDT(report.expenses.total)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-500/20 text-red-600">
                    <TrendingDown size={24} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {report.expenses.details.length} expense accounts
                  </p>
                </div>
              </div>

              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Net {report.netProfit.isProfit ? 'Profit' : 'Loss'}
                    </p>
                    <p className={`text-2xl font-bold ${
                      report.netProfit.isProfit ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatBDT(report.netProfit.amount)}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    report.netProfit.isProfit 
                      ? 'bg-green-500/20 text-green-600' 
                      : 'bg-red-500/20 text-red-600'
                  }`}>
                    <DollarSign size={24} />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Profit Margin: {calculatePercentage(report.netProfit.amount, report.income.total)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Profit & Loss Statement */}
            <div className={`rounded-xl overflow-hidden mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              {/* Statement Header */}
              <div className="p-6 border-b border-gray-700 dark:border-gray-600">
                <div className="text-center">
                  <h2 className="text-xl font-bold">Tanisha Enterprise</h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Profit & Loss Statement
                  </p>
                  <p className="text-sm mt-2">
                    For the period from {report.period.startDate} to {report.period.endDate}
                  </p>
                </div>
              </div>

              {/* Income Section */}
              <div className="border-b border-gray-700 dark:border-gray-600">
                <div 
                  className="p-4 bg-gray-50 dark:bg-gray-750 cursor-pointer"
                  onClick={() => toggleSection('income')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedSections.income ? (
                        <ChevronDown className="mr-2" />
                      ) : (
                        <ChevronRight className="mr-2" />
                      )}
                      <h3 className="text-lg font-bold flex items-center">
                        <TrendingUp className="mr-2 text-green-600" />
                        Income (আয়)
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Income</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatBDT(report.income.total)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {expandedSections.income && (
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700 dark:border-gray-600">
                            <th className="text-left py-2 px-4">Account</th>
                            <th className="text-left py-2 px-4">Code</th>
                            <th className="text-left py-2 px-4">Percentage</th>
                            <th className="text-left py-2 px-4">Amount (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.income.details.map((item, index) => (
                            <tr 
                              key={index}
                              className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750"
                            >
                              <td className="py-3 px-4">
                                <p className="font-medium">{item.name}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.code}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${calculatePercentage(item.amount, report.income.total)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm">
                                    {calculatePercentage(item.amount, report.income.total)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-green-600">
                                  {formatBDT(item.amount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Expenses Section */}
              <div className="border-b border-gray-700 dark:border-gray-600">
                <div 
                  className="p-4 bg-gray-50 dark:bg-gray-750 cursor-pointer"
                  onClick={() => toggleSection('expenses')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedSections.expenses ? (
                        <ChevronDown className="mr-2" />
                      ) : (
                        <ChevronRight className="mr-2" />
                      )}
                      <h3 className="text-lg font-bold flex items-center">
                        <TrendingDown className="mr-2 text-red-600" />
                        Expenses (ব্যয়)
                      </h3>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatBDT(report.expenses.total)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {expandedSections.expenses && (
                  <div className="p-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700 dark:border-gray-600">
                            <th className="text-left py-2 px-4">Account</th>
                            <th className="text-left py-2 px-4">Code</th>
                            <th className="text-left py-2 px-4">Percentage</th>
                            <th className="text-left py-2 px-4">Amount (৳)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.expenses.details.map((item, index) => (
                            <tr 
                              key={index}
                              className="border-b border-gray-700 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-750"
                            >
                              <td className="py-3 px-4">
                                <p className="font-medium">{item.name}</p>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  {item.code}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                                    <div 
                                      className="bg-red-500 h-2 rounded-full"
                                      style={{ width: `${calculatePercentage(item.amount, report.expenses.total)}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm">
                                    {calculatePercentage(item.amount, report.expenses.total)}%
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold text-red-600">
                                  {formatBDT(item.amount)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Net Profit/Loss */}
              <div className="p-6 bg-gray-50 dark:bg-gray-750">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <DollarSign className={`mr-2 ${
                      report.netProfit.isProfit ? 'text-green-600' : 'text-red-600'
                    }`} size={24} />
                    <div>
                      <h3 className="text-lg font-bold">
                        Net {report.netProfit.isProfit ? 'Profit' : 'Loss'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {report.income.total} - {report.expenses.total}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${
                      report.netProfit.isProfit ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatBDT(report.netProfit.amount)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {report.netProfit.isProfit ? 'Profit' : 'Loss'} Margin: {calculatePercentage(report.netProfit.amount, report.income.total)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Income vs Expenses Chart */}
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <BarChart3 className="mr-2" />
                  Income vs Expenses
                </h3>
                <div className="h-64 flex items-end space-x-4">
                  <div className="flex-1">
                    <div className="text-center mb-2">
                      <p className="text-sm text-green-600 font-medium">Income</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatBDT(report.income.total)}
                      </p>
                    </div>
                    <div 
                      className="bg-green-500 rounded-t-lg mx-auto"
                      style={{ 
                        width: '60%',
                        height: `${Math.min(100, (report.income.total / (report.income.total + report.expenses.total)) * 100)}%`
                      }}
                    ></div>
                  </div>
                  <div className="flex-1">
                    <div className="text-center mb-2">
                      <p className="text-sm text-red-600 font-medium">Expenses</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatBDT(report.expenses.total)}
                      </p>
                    </div>
                    <div 
                      className="bg-red-500 rounded-t-lg mx-auto"
                      style={{ 
                        width: '60%',
                        height: `${Math.min(100, (report.expenses.total / (report.income.total + report.expenses.total)) * 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Expense to Income Ratio: {calculatePercentage(report.expenses.total, report.income.total)}%
                  </p>
                </div>
              </div>

              {/* Top Income/Expense Categories */}
              <div className={`rounded-xl p-6 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <PieChart className="mr-2" />
                  Top Categories
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-green-600">Top Income Sources</h4>
                    {report.income.details
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={index} className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm">{item.name}</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${calculatePercentage(item.amount, report.income.total)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium text-green-600">
                              {formatBDT(item.amount)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {calculatePercentage(item.amount, report.income.total)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-red-600">Major Expenses</h4>
                    {report.expenses.details
                      .sort((a, b) => b.amount - a.amount)
                      .slice(0, 3)
                      .map((item, index) => (
                        <div key={index} className="flex items-center justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm">{item.name}</p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div 
                                className="bg-red-500 h-1.5 rounded-full"
                                style={{ width: `${calculatePercentage(item.amount, report.expenses.total)}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium text-red-600">
                              {formatBDT(item.amount)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {calculatePercentage(item.amount, report.expenses.total)}%
                            </p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics */}
            <div className={`rounded-xl p-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4">Key Financial Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gross Profit Margin</p>
                  <p className="text-xl font-bold text-green-600">
                    {calculatePercentage(report.income.total - report.expenses.total, report.income.total)}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Expense Ratio</p>
                  <p className="text-xl font-bold text-red-600">
                    {calculatePercentage(report.expenses.total, report.income.total)}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Profit Ratio</p>
                  <p className={`text-xl font-bold ${
                    report.netProfit.isProfit ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {calculatePercentage(Math.abs(report.netProfit.amount), report.income.total)}%
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-750">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Operational Efficiency</p>
                  <p className="text-xl font-bold text-blue-600">
                    {calculatePercentage(report.income.total, report.income.total + report.expenses.total)}%
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`rounded-xl p-12 text-center ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No Data Available</h3>
            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No profit & loss data found for the selected period
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfitLoss;