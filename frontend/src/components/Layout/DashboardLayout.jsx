import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard,
  Package,
  Warehouse,
  Users,
  FileText,
  CreditCard,
  Settings,
  HelpCircle,
  UserCog,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Home,
  ShoppingCart,
  BarChart3,
  Building,
  BookOpen,
  ShoppingBag,
  Wrench
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard />, label: 'Dashboard', active: true },
    { id: 'products', icon: <Package />, label: 'Products' },
    { id: 'inventory', icon: <Warehouse />, label: 'Inventory' },
    { id: 'customers', icon: <Users />, label: 'Customers' },
    
    // ============ NEW SECTIONS ============
    { separator: true, label: 'Business Operations' },
    
    // Accounts Section
    { 
      id: 'accounts', 
      icon: <BookOpen />, 
      label: 'Accounts (হিসাব)',
      subItems: [
        { id: 'accounts-heads', label: 'Accounts Heads' },
        { id: 'accounts-groups', label: 'Accounts Groups' },
        { id: 'transactions', label: 'Transactions / লেনদেন' }
      ]
    },
    
    // Stock Section
    { 
      id: 'stock', 
      icon: <Package />, 
      label: 'Stock (স্টক)',
      subItems: [
        { id: 'stock-groups', label: 'Stock Groups' },
        { id: 'stock-transfer', label: 'Stock Transfer' },
        { id: 'search-product', label: 'Search Product (পণ্য খুঁজুন)' }
      ]
    },
    
    // Purchase Section
    { 
      id: 'purchase', 
      icon: <ShoppingBag />, 
      label: 'Purchase (ক্রয়)',
      subItems: [
        { id: 'suppliers', label: 'Suppliers' },
        { id: 'branches', label: 'Branches' },
        { id: 'warehouses', label: 'Warehouses' },
        { id: 'unit-measure', label: 'Unit of Measure' },
        { id: 'product-groups', label: 'Product Groups' },
        { id: 'purchase-orders', label: 'Purchase Orders' },
        { id: 'supplier-payments', label: 'Supplier Payments' }
      ]
    },
    
    // Sales Section
    { 
      id: 'sales', 
      icon: <ShoppingCart />, 
      label: 'Sales (বিক্রয়)',
      subItems: [
        { id: 'customers-list', label: 'Customers' },
        { id: 'create-sale', label: 'Create Sale' },
        { id: 'sales-list', label: 'Sales List' },
        { id: 'sales-payments', label: 'Sales Payments' }
      ]
    },
    
    // Reports Section
    { 
      id: 'reports', 
      icon: <FileText />, 
      label: 'Reports (রিপোর্ট)',
      subItems: [
        { id: 'purchase-report', label: 'Purchase Report' },
        { id: 'sales-report', label: 'Sales Report' },
        { id: 'product-report', label: 'Product Report' },
        { id: 'customer-ledger', label: 'Customer Ledger' },
        { id: 'supplier-ledger', label: 'Supplier Ledger' }
      ]
    },
    
    // Services Section (NEW)
    { 
      id: 'services', 
      icon: <Wrench />, 
      label: 'Services (সার্ভিস)',
      subItems: [
        { id: 'service-requests', label: 'Service Requests' },
        { id: 'service-history', label: 'Service History' },
        { id: 'service-products', label: 'Service Products' },
        { id: 'service-reports', label: 'Service Reports' }
      ]
    },
    
    { separator: true, label: 'System' },
    
    // Settings Section
    { 
      id: 'settings', 
      icon: <Settings />, 
      label: 'Settings',
      subItems: [
        { id: 'company-info', label: 'Company Information' },
        { id: 'branch-management', label: 'Branch Management' },
        { id: 'tax-settings', label: 'Tax Settings' },
        { id: 'user-management', label: 'User Management' },
        { id: 'backup-restore', label: 'Backup & Restore' },
        { id: 'language-toggle', label: 'বাংলা/English' }
      ]
    },
    
    // Help Section
    { 
      id: 'help', 
      icon: <HelpCircle />, 
      label: 'Help',
      subItems: [
        { id: 'user-guide', label: 'User Guide' },
        { id: 'video-tutorials', label: 'Video Tutorials' },
        { id: 'faq', label: 'FAQ' },
        { id: 'contact-support', label: 'Contact Support' }
      ]
    }
  ];

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      
      {/* Left Sidebar - Fixed */}
      <aside className={`fixed left-0 top-0 h-screen z-40 transition-all duration-300 flex flex-col ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } ${theme === 'dark' ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}`}>
        
        {/* Logo Section */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            {!sidebarCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">তানিশা এন্টারপ্রাইজ</h1>
                  <p className="text-xs opacity-60">Business Management</p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto">
                <Building className="w-6 h-6 text-white" />
              </div>
            )}
            
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{user?.name || 'Admin User'}</h3>
                <p className="text-sm opacity-60 capitalize">{user?.role || 'admin'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {navItems.map((item, index) => (
              item.separator ? (
                <li key={`separator-${index}`} className={`my-4 ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
                  <div className={`h-px ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                </li>
              ) : (
                <li key={item.id}>
                  <button
                    className={`w-full flex items-center rounded-lg p-3 transition-colors ${
                      item.active
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                        : theme === 'dark'
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                    } ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}
                  >
                    <span className={`${item.active ? 'text-white' : 'text-current'}`}>
                      {item.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                </li>
              )
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center rounded-lg p-3 mb-3 ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600' 
                : 'bg-gray-100 hover:bg-gray-200'
            } ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            {!sidebarCollapsed && (
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            )}
          </button>

          {/* Company Info (Only show when expanded) */}
          {!sidebarCollapsed && (
            <div className="text-xs text-center opacity-60">
              <p>MaxoraSoft © 2025</p>
              <p className="mt-1">Prepared by Eng. Tanbir Rifat</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarCollapsed ? 'ml-20' : 'ml-64'
      }`}>
        {/* Top Header */}
        <header className={`sticky top-0 z-30 border-b ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Dashboard Overview</h2>
              <p className="text-sm opacity-60">Welcome to Tanisha Enterprise Management</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <span className="font-medium">Branch: </span>
                <span>Dhaka Main</span>
              </div>
              
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Bottom Footer */}
        <footer className={`mt-auto border-t py-6 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-bold mb-2">তানিশা এন্টারপ্রাইজ</h4>
                <p className="text-sm opacity-70">
                  Shop-14, Floor-1, Mohammadia Machinery Market<br />
                  176 No Nawabpur Road, Dhaka 1100<br />
                  Phone: +880 1234 567890
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">Products & Services</h4>
                <p className="text-sm opacity-70">
                  Fogger • Grass Cutter • Fogger Oil<br />
                  Spare Parts • Lawn Mower • Generator
                </p>
              </div>
              
              <div>
                <h4 className="font-bold mb-2">Software Information</h4>
                <p className="text-sm opacity-70">
                  Developed by: Eng. Tanbir Rifat<br />
                  Software by: MaxoraSoft<br />
                  Version: 1.0.0 • © 2025 All Rights Reserved
                </p>
              </div>
            </div>
            
            <div className={`mt-6 pt-6 border-t text-center text-sm ${
              theme === 'dark' ? 'border-gray-700 opacity-50' : 'border-gray-200 opacity-60'
            }`}>
              <p>Tanisha Enterprise Business Management System • Professional Dashboard</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DashboardLayout;