import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  MoreVertical
} from 'lucide-react';
import { formatBDT } from '../../utils/bdtFormatter';

const RecentOrders = ({ orders, loading }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <ShoppingBag className="w-5 h-5 text-gray-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All ?
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          // Loading Skeleton
          <div className="p-6">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center py-4 border-b last:border-0 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded mr-4"></div>
                <div className="w-20 h-8 bg-gray-200 rounded mr-4"></div>
                <div className="w-24 h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-gray-600 font-medium">No recent orders</h4>
            <p className="text-gray-500 text-sm mt-1">Orders will appear here as they come in</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Product</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Customer</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Order ID</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Date</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm">Amount</th>
                <th className="text-left py-3 px-6 font-medium text-gray-700 text-sm"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order, index) => (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                  className="transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center mr-3">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{order.product}</p>
                        <p className="text-xs text-gray-500">SKU: {order.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-medium text-gray-900">{order.customer}</p>
                    <p className="text-xs text-gray-500">Regular Customer</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono font-semibold text-blue-600">{order.orderId}</span>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-gray-900">
  {order.formattedDate || (order.date ? new Date(order.date).toLocaleDateString() : 'N/A')}
</p>
<p className="text-xs text-gray-500">
  {order.date ? new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
</p>
                  </td>
                  <td className="py-4 px-6">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-2 capitalize">{order.status}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-gray-900">{formatBDT(order.amount)}</p>
                    <p className="text-xs text-gray-500">Paid</p>
                  </td>
                  <td className="py-4 px-6">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer */}
      {orders.length > 0 && (
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing {Math.min(orders.length, 5)} of {orders.length} recent orders
          </p>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-100">Previous</button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Next</button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecentOrders;
