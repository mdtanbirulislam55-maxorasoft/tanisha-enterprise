import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { settingsAPI } from '../../services/api';
import {
  Users, Plus, Search, Filter,
  Edit, Trash2, Eye, Lock,
  CheckCircle, XCircle, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsUsers = () => {
  const { theme } = useTheme();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    role: 'staff',
    designation: '',
    branchId: 1,
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await settingsAPI.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const userData = { ...formData };
      delete userData.confirmPassword;

      const response = await settingsAPI.createUser(userData);
      if (response.success) {
        toast.success('User created successfully');
        setShowForm(false);
        resetForm();
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to create user');
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      phone: '',
      role: 'staff',
      designation: '',
      branchId: 1,
      isActive: true
    });
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await settingsAPI.deleteUser(userId);
      if (response.success) {
        toast.success('User deleted successfully');
        fetchUsers();
      }
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return { color: 'text-red-600', bg: 'bg-red-500/20', text: 'Admin' };
      case 'manager':
        return { color: 'text-blue-600', bg: 'bg-blue-500/20', text: 'Manager' };
      case 'accountant':
        return { color: 'text-green-600', bg: 'bg-green-500/20', text: 'Accountant' };
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-500/20', text: 'Staff' };
    }
  };

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <Users className="mr-3" />
                User Management (ব্যবহারকারী ব্যবস্থাপনা)
              </h1>
              <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Tanisha Enterprise - Manage system users and permissions
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center"
              >
                <Plus className="mr-2" size={18} />
                Add User
              </button>
              <button
                onClick={fetchUsers}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center"
              >
                <RefreshCw className="mr-2" size={18} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* User Form */}
        {showForm && (
          <div className={`mb-6 rounded-xl p-6 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className="text-xl font-bold mb-6">Create New User</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="staff">Staff</option>
                    <option value="accountant">Accountant</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({...formData, designation: e.target.value})}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600' 
                        : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filters */}
        <div className={`mb-6 rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="relative flex-1 mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 flex items-center">
              <Filter className="mr-2" size={18} />
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl p-12 text-center bg-gray-800 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading users...</p>
          </div>
        ) : (
          <>
            {/* Users Table */}
            <div className={`rounded-xl overflow-hidden mb-6 ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <th className="text-left py-3 px-6">User</th>
                      <th className="text-left py-3 px-6">Contact</th>
                      <th className="text-left py-3 px-6">Role</th>
                      <th className="text-left py-3 px-6">Status</th>
                      <th className="text-left py-3 px-6">Last Login</th>
                      <th className="text-left py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => 
                        user.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        user.email.toLowerCase().includes(search.toLowerCase()) ||
                        user.username.toLowerCase().includes(search.toLowerCase())
                      )
                      .map((user) => {
                        const roleBadge = getRoleBadge(user.role);
                        
                        return (
                          <tr 
                            key={user.id}
                            className={`border-b ${
                              theme === 'dark' 
                                ? 'border-gray-700 hover:bg-gray-750' 
                                : 'border-gray-100 hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-3 px-6">
                              <div>
                                <p className="font-medium">{user.fullName}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  @{user.username}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 px-6">
                              <div>
                                <p className="text-sm">{user.email}</p>
                                {user.phone && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {user.phone}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-6">
                              <span className={`px-2 py-1 rounded text-xs ${roleBadge.bg} ${roleBadge.color}`}>
                                {roleBadge.text}
                              </span>
                              {user.designation && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  {user.designation}
                                </p>
                              )}
                            </td>
                            <td className="py-3 px-6">
                              <div className="flex items-center">
                                {user.isActive ? (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                    <span className="text-green-600">Active</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                                    <span className="text-red-600">Inactive</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-6">
                              {user.lastLogin ? (
                                <p className="text-sm">
                                  {new Date(user.lastLogin).toLocaleDateString()}
                                </p>
                              ) : (
                                <span className="text-gray-500">Never</span>
                              )}
                            </td>
                            <td className="py-3 px-6">
                              <div className="flex items-center space-x-2">
                                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                  <Eye size={16} />
                                </button>
                                <button className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded text-blue-600">
                                  <Edit size={16} />
                                </button>
                                <button className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded text-green-600">
                                  <Lock size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded text-red-600"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded-xl p-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Users
                </p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>

              <div className={`rounded-xl p-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Users
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>

              <div className={`rounded-xl p-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Admin Users
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>

              <div className={`rounded-xl p-4 ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Staff Users
                </p>
                <p className="text-2xl font-bold">
                  {users.filter(u => u.role === 'staff').length}
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SettingsUsers;