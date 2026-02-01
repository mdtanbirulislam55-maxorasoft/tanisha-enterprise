import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Truck,
  Calendar,
  User,
  Phone,
  MapPin,
  Battery,
  Filter,
  Download,
  Search
} from 'lucide-react';

const OurServices = () => {
  const { theme } = useTheme();
  const [filter, setFilter] = useState('all');

  // Tanisha Enterprise Products for Service
  const tanishaProducts = [
    { id: 1, name: 'Fogger Machine', category: 'Fogger', serviceCount: 156 },
    { id: 2, name: 'Grass Cutter', category: 'Grass Cutter', serviceCount: 128 },
    { id: 3, name: 'Generator', category: 'Generator', serviceCount: 89 },
    { id: 4, name: 'Lawn Mower', category: 'Lawn Mower', serviceCount: 76 },
    { id: 5, name: 'Fogger Oil Pump', category: 'Fogger', serviceCount: 45 },
    { id: 6, name: 'Brush Cutter Blade', category: 'Spare Parts', serviceCount: 234 }
  ];

  // Service Requests Data
  const serviceRequests = [
    { 
      id: 'SR-001', 
      product: 'Fogger Machine', 
      customer: 'Monte Hoverson', 
      date: '20 Dec 2025', 
      status: 'In Progress', 
      technician: 'John Doe',
      priority: 'High',
      estimatedCompletion: '22 Dec 2025'
    },
    { 
      id: 'SR-002', 
      product: 'Generator', 
      customer: 'Green Lawn Services', 
      date: '19 Dec 2025', 
      status: 'Pending', 
      technician: 'Assign',
      priority: 'Medium',
      estimatedCompletion: '24 Dec 2025'
    },
    { 
      id: 'SR-003', 
      product: 'Grass Cutter', 
      customer: 'ABC Pest Control', 
      date: '18 Dec 2025', 
      status: 'Completed', 
      technician: 'Sarah Smith',
      priority: 'Low',
      estimatedCompletion: 'Completed'
    },
    { 
      id: 'SR-004', 
      product: 'Lawn Mower', 
      customer: 'Urban Gardens', 
      date: '17 Dec 2025', 
      status: 'In Progress', 
      technician: 'Mike Chen',
      priority: 'High',
      estimatedCompletion: '21 Dec 2025'
    },
    { 
      id: 'SR-005', 
      product: 'Fogger Oil Pump', 
      customer: 'Kim Constructions', 
      date: '16 Dec 2025', 
      status: 'Pending Parts', 
      technician: 'Waiting',
      priority: 'Medium',
      estimatedCompletion: '26 Dec 2025'
    }
  ];

  // Service Statistics
  const serviceStats = {
    totalRequests: 156,
    inProgress: 45,
    completed: 89,
    pending: 22,
    avgCompletionTime: '2.5 days',
    revenue: '৳ 4,85,000'
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-500/20 text-green-700';
      case 'In Progress': return 'bg-blue-500/20 text-blue-700';
      case 'Pending': return 'bg-yellow-500/20 text-yellow-700';
      case 'Pending Parts': return 'bg-orange-500/20 text-orange-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-500/20 text-red-700';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-700';
      case 'Low': return 'bg-green-500/20 text-green-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  return (
    <div className={`rounded-2xl p-6 ${
      theme === 'dark' ? 'bg-gray-800' : 'bg-white'
    } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Our Services (আমাদের সার্ভিস)</h3>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Tanisha Enterprise Service Management Dashboard
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Filter size={18} />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className={`bg-transparent outline-none ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              <option value="all">All Services</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          
          <button className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white`}>
            <Download size={18} />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Service Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-750' : 'bg-blue-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Requests
              </p>
              <p className="text-2xl font-bold">{serviceStats.totalRequests}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
              <Wrench size={20} />
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-750' : 'bg-green-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                In Progress
              </p>
              <p className="text-2xl font-bold text-blue-600">{serviceStats.inProgress}</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-600">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-750' : 'bg-purple-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Completed
              </p>
              <p className="text-2xl font-bold text-green-600">{serviceStats.completed}</p>
            </div>
            <div className="p-2 rounded-lg bg-green-500/20 text-green-600">
              <CheckCircle size={20} />
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-750' : 'bg-orange-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Service Revenue
              </p>
              <p className="text-2xl font-bold text-purple-600">{serviceStats.revenue}</p>
            </div>
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-600">
              <Truck size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Service Products */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold">Service Products (সার্ভিস করা পণ্য)</h4>
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-lg ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search product..."
              className={`bg-transparent outline-none text-sm ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {tanishaProducts.map((product) => (
            <div 
              key={product.id}
              className={`p-4 rounded-xl text-center ${
                theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
              } hover:shadow-md transition-shadow`}
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500 mx-auto mb-3 flex items-center justify-center">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <h5 className="font-medium mb-1">{product.name}</h5>
              <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {product.category}
              </p>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-700">
                {product.serviceCount} Services
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Service Requests Table */}
      <div>
        <h4 className="font-bold mb-4">Current Service Requests</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${
                theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <th className="text-left py-3 font-medium text-sm">Service ID</th>
                <th className="text-left py-3 font-medium text-sm">Product</th>
                <th className="text-left py-3 font-medium text-sm">Customer</th>
                <th className="text-left py-3 font-medium text-sm">Status</th>
                <th className="text-left py-3 font-medium text-sm">Technician</th>
                <th className="text-left py-3 font-medium text-sm">Priority</th>
                <th className="text-left py-3 font-medium text-sm">Completion</th>
              </tr>
            </thead>
            <tbody>
              {serviceRequests
                .filter(item => filter === 'all' || item.status.toLowerCase().includes(filter))
                .map((request) => (
                  <tr 
                    key={request.id}
                    className={`border-b ${
                      theme === 'dark' 
                        ? 'border-gray-700 hover:bg-gray-750' 
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3">
                      <span className="font-mono font-bold">{request.id}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center mr-2">
                          <Wrench size={14} className="text-blue-600" />
                        </div>
                        <span>{request.product}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{request.customer}</p>
                        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {request.date}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <User size={14} className="mr-1" />
                        <span>{request.technician}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center">
                        <Calendar size={14} className="mr-1" />
                        <span>{request.estimatedCompletion}</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className={`mt-6 p-4 rounded-xl ${
          theme === 'dark' ? 'bg-gray-750' : 'bg-blue-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="text-blue-600 mr-2" />
              <p className="font-medium">Service Summary</p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Avg. Completion Time: <span className="font-bold">{serviceStats.avgCompletionTime}</span>
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Revenue: <span className="font-bold">{serviceStats.revenue}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OurServices;