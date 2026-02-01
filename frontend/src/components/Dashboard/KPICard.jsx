import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const KPICard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel, 
  color = 'blue', 
  loading = false 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  const iconClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative rounded-2xl border p-6 ${colorClasses[color]} transition-all duration-300 hover:shadow-lg`}
    >
      {/* Background pattern */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
        <div className="absolute inset-0 bg-current rounded-full"></div>
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${iconClasses[color]} mr-3`}>
              {icon}
            </div>
            <h3 className="font-medium text-sm opacity-90">{title}</h3>
          </div>
          
          {/* Trend Indicator */}
          {trend !== undefined && (
            <div className={`flex items-center text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span className="font-semibold">
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            </div>
          )}
        </div>

        {/* Main Value */}
        {loading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-current opacity-20 rounded-lg mb-2"></div>
            <div className="h-4 bg-current opacity-10 rounded w-1/2"></div>
          </div>
        ) : (
          <>
            <div className="mb-2">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold"
              >
                {value}
              </motion.h2>
            </div>

            {/* Trend Label */}
            {trendLabel && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-sm opacity-75"
              >
                {trendLabel}
              </motion.p>
            )}
          </>
        )}

        {/* Progress Bar */}
        {trend !== undefined && !loading && (
          <div className="mt-4">
            <div className="h-1.5 bg-current opacity-20 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.abs(trend), 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${trend >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default KPICard;