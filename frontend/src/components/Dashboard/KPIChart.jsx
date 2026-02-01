import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const KPIChart = ({ data }) => {
  const chartData = data || [
    { month: 'Jan', sales: 65, target: 70 },
    { month: 'Feb', sales: 59, target: 65 },
    { month: 'Mar', sales: 80, target: 75 },
    { month: 'Apr', sales: 81, target: 80 },
    { month: 'May', sales: 56, target: 70 },
    { month: 'Jun', sales: 55, target: 65 },
    { month: 'Jul', sales: 40, target: 60 },
  ];

  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">Sales Performance</h3>
          <p className="text-gray-500 dark:text-gray-400">Monthly revenue comparison</p>
        </div>
        <div className="flex items-center text-green-600">
          <TrendingUp className="h-5 w-5 mr-1" />
          <span className="font-semibold">+12.5%</span>
        </div>
      </div>

      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              formatter={(value) => [`₹${value}K`, 'Sales']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Bar dataKey="sales" name="Actual Sales" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.sales >= entry.target ? '#10b981' : '#3b82f6'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹245K</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">+24.5%</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Growth Rate</div>
        </div>
      </div>
    </div>
  );
};

export default KPIChart;
