import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { formatBDT } from '../../utils/bdtFormatter';

const WeeklySummary = ({ data, loading }) => {
  // Find max value for scaling
  const maxValue = Math.max(...data.map(item => item.sales), 1);
  
  // Calculate week over week growth
  const calculateGrowth = () => {
    if (data.length < 2) return 0;
    const currentWeek = data[data.length - 1]?.sales || 0;
    const lastWeek = data[0]?.sales || 0;
    if (lastWeek === 0) return 100;
    return ((currentWeek - lastWeek) / lastWeek * 100).toFixed(1);
  };

  const growth = calculateGrowth();
  const isPositive = growth >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border p-6"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center mb-2">
            <BarChart3 className="w-5 h-5 text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Weekly Summary</h3>
          </div>
          <p className="text-gray-600">Sales performance over the last 7 days</p>
        </div>
        
        <div className="text-right">
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${isPositive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            <span className="font-semibold">{isPositive ? '+' : ''}{growth}%</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">vs last week</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        ) : (
          <>
            {/* Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pb-16">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-gray-100"></div>
              ))}
            </div>

            {/* Bars */}
            <div className="flex items-end justify-between h-48 pt-8 px-2">
              {data.map((item, index) => {
                const height = (item.sales / maxValue) * 100;
                const isToday = index === data.length - 1;
                
                return (
                  <motion.div
                    key={item.date}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ 
                      duration: 0.8, 
                      delay: index * 0.1,
                      ease: "easeOut" 
                    }}
                    whileHover={{ scale: 1.05 }}
                    className="relative flex flex-col items-center w-12"
                  >
                    {/* Bar */}
                    <div 
                      className={`w-10 rounded-t-lg ${isToday ? 'bg-gradient-to-t from-blue-600 to-blue-500' : 'bg-gradient-to-t from-blue-400 to-blue-300'}`}
                      style={{ height: '100%' }}
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          <div className="font-semibold">{formatBDT(item.sales)}</div>
                        </div>
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                      </div>
                    </div>
                    
                    {/* Date Label */}
                    <div className="mt-4 text-center">
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
                        {item.formattedDate}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.sales > 0 ? formatBDT(item.sales, true) : '৳0'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* X-axis */}
            <div className="border-t border-gray-200 mt-8 pt-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Week Start</span>
                <span>Today</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm text-gray-700">Daily Sales</span>
        </div>
        <div className="text-sm text-gray-600">
          Total: <span className="font-semibold text-gray-900">
            {formatBDT(data.reduce((sum, item) => sum + item.sales, 0))}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default WeeklySummary;