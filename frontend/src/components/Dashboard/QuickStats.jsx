import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Users, 
  Building, 
  CreditCard, 
  Activity,
  Zap
} from 'lucide-react';

const QuickStats = ({ stats, loading }) => {
  const quickStats = [
    {
      icon: <Package className="w-5 h-5" />,
      label: 'Total Products',
      value: stats?.totalProducts || 0,
      color: 'blue',
      change: '+12',
      description: 'Active in inventory'
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Customers',
      value: stats?.totalCustomers || 0,
      color: 'green',
      change: '+5',
      description: 'Active this month'
    },
    {
      icon: <Building className="w-5 h-5" />,
      label: 'Suppliers',
      value: stats?.totalSuppliers || 0,
      color: 'purple',
      change: '+2',
      description: 'Trusted partners'
    },
    {
      icon: <CreditCard className="w-5 h-5" />,
      label: 'Transactions',
      value: '1,248',
      color: 'orange',
      change: '+23%',
      description: 'This month'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Activity className="w-5 h-5 text-blue-400 mr-3" />
            <h3 className="text-lg font-semibold">Quick Stats</h3>
          </div>
          <p className="text-gray-400 text-sm">Overview of your business metrics</p>
        </div>
        <div className="p-2 bg-gray-800 rounded-lg">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {quickStats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`p-2 rounded-lg ${
                  stat.color === 'blue' ? 'bg-blue-900/30 text-blue-400' :
                  stat.color === 'green' ? 'bg-green-900/30 text-green-400' :
                  stat.color === 'purple' ? 'bg-purple-900/30 text-purple-400' :
                  'bg-orange-900/30 text-orange-400'
                } inline-block mb-3`}>
                  {stat.icon}
                </div>
                <h4 className="text-sm text-gray-400">{stat.label}</h4>
                
                {loading ? (
                  <div className="animate-pulse mt-2">
                    <div className="h-8 bg-gray-700 rounded w-16"></div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline mt-2">
                      <span className="text-2xl font-bold">{stat.value}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        stat.change.startsWith('+') ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Performance Indicator */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Performance Score</span>
          <span className="text-sm font-semibold">84/100</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '84%' }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Low</span>
          <span>Excellent</span>
        </div>
      </div>
    </motion.div>
  );
};

export default QuickStats;