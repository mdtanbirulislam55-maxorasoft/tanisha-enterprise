import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  HelpCircle, Search, ChevronDown, ChevronRight,
  BookOpen, FileText, Settings, ShoppingCart,
  Users, Package, DollarSign, BarChart3
} from 'lucide-react';

const HelpFAQ = () => {
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState({});

  const faqCategories = [
    {
      id: 'general',
      name: 'General',
      icon: <HelpCircle size={20} />,
      questions: [
        {
          q: 'What is Tanisha Enterprise Business Suite?',
          a: 'Tanisha Enterprise Business Suite is a comprehensive software solution designed specifically for agricultural machinery trading businesses. It helps manage sales, purchases, inventory, accounts, and customer relationships.'
        },
        {
          q: 'How do I get started with the system?',
          a: '1. Complete company setup in Settings\n2. Add your products and categories\n3. Create customer and supplier records\n4. Start creating sales and purchase orders\n5. Monitor through dashboard reports'
        },
        {
          q: 'Is there mobile app available?',
          a: 'Currently we have web-based application that works perfectly on mobile browsers. Native mobile apps are under development.'
        }
      ]
    },
    {
      id: 'sales',
      name: 'Sales Management',
      icon: <ShoppingCart size={20} />,
      questions: [
        {
          q: 'How to create a sales invoice?',
          a: 'Go to Sales → Create Sale → Select customer → Add products → Set prices → Apply discounts/taxes → Save invoice. System automatically updates stock and customer balance.'
        },
        {
          q: 'Can I edit or cancel an invoice?',
          a: 'Yes, you can edit pending invoices. For completed invoices, you need to create a return/credit note. Cancellation requires proper authorization.'
        },
        {
          q: 'How to track customer payments?',
          a: 'Each invoice shows payment status. You can add payments from invoice details or Customer Ledger. System tracks paid, due, and overdue amounts.'
        }
      ]
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: <Package size={20} />,
      questions: [
        {
          q: 'How to add new products?',
          a: 'Go to Products → Add Product → Fill details (code, name, category, prices, stock) → Save. You can also import products via Excel.'
        },
        {
          q: 'What is low stock alert?',
          a: 'System alerts when product stock reaches reorder level. You can set alert levels per product in product settings.'
        },
        {
          q: 'How stock transfer works?',
          a: 'Stock → Transfer → Select from/to warehouse → Add items → Confirm. System updates stock in both warehouses automatically.'
        }
      ]
    },
    {
      id: 'accounts',
      name: 'Accounts',
      icon: <DollarSign size={20} />,
      questions: [
        {
          q: 'How to view trial balance?',
          a: 'Accounts → Trial Balance → Select date → View report. Shows all account balances with debit/credit totals.'
        },
        {
          q: 'What reports are available?',
          a: 'Profit & Loss, Balance Sheet, Cash Flow, Sales Reports, Purchase Reports, Inventory Reports, Customer/Supplier Ledgers.'
        },
        {
          q: 'How to record journal entries?',
          a: 'Accounts → Journal Entry → Add debit/credit entries → Ensure totals match → Save. System posts to respective accounts.'
        }
      ]
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: <Settings size={20} />,
      questions: [
        {
          q: 'How to add new users?',
          a: 'Settings → User Management → Add User → Fill details → Set role/permissions → Save. Users receive email with login credentials.'
        },
        {
          q: 'Can I customize invoice format?',
          a: 'Yes, go to Settings → Invoice Settings. You can customize logo, header, footer, terms, and layout.'
        },
        {
          q: 'How to backup data?',
          a: 'Settings → Backup & Restore → Create Backup. We recommend daily backups. You can also schedule automatic backups.'
        }
      ]
    }
  ];

  const toggleFAQ = (categoryId, questionIndex) => {
    const key = `${categoryId}-${questionIndex}`;
    setExpandedFAQ(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(q => 
      q.q.toLowerCase().includes(search.toLowerCase()) ||
      q.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className={`min-h-screen p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
          <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Find answers to common questions about Tanisha Enterprise Business Suite
          </p>
        </div>

        {/* Search */}
        <div className={`mb-8 rounded-xl p-4 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search questions or topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600' 
                  : 'bg-white border-gray-300'
              }`}
            />
          </div>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Help Topics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="#sales" className={`p-4 rounded-lg border flex flex-col items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <ShoppingCart className="w-6 h-6 mb-2 text-blue-600" />
              <span className="text-sm font-medium">Sales Help</span>
            </a>
            <a href="#inventory" className={`p-4 rounded-lg border flex flex-col items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <Package className="w-6 h-6 mb-2 text-green-600" />
              <span className="text-sm font-medium">Inventory Help</span>
            </a>
            <a href="#accounts" className={`p-4 rounded-lg border flex flex-col items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <DollarSign className="w-6 h-6 mb-2 text-purple-600" />
              <span className="text-sm font-medium">Accounts Help</span>
            </a>
            <a href="#settings" className={`p-4 rounded-lg border flex flex-col items-center justify-center ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}>
              <Settings className="w-6 h-6 mb-2 text-orange-600" />
              <span className="text-sm font-medium">Settings Help</span>
            </a>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {filteredCategories.map((category) => (
            <div key={category.id} id={category.id}>
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 mr-3">
                  {category.icon}
                </div>
                <h2 className="text-2xl font-bold">{category.name}</h2>
              </div>

              <div className="space-y-3">
                {category.questions.map((question, index) => {
                  const key = `${category.id}-${index}`;
                  const isExpanded = expandedFAQ[key];
                  
                  return (
                    <div
                      key={key}
                      className={`rounded-lg border ${
                        theme === 'dark' 
                          ? 'border-gray-700' 
                          : 'border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => toggleFAQ(category.id, index)}
                        className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          isExpanded ? 'bg-gray-50 dark:bg-gray-800' : ''
                        }`}
                      >
                        <span className="font-medium">{question.q}</span>
                        {isExpanded ? (
                          <ChevronDown className="text-gray-500" />
                        ) : (
                          <ChevronRight className="text-gray-500" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 pt-0">
                          <div className={`p-4 rounded-lg ${
                            theme === 'dark' 
                              ? 'bg-gray-750' 
                              : 'bg-gray-50'
                          }`}>
                            <p className="whitespace-pre-line">{question.a}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Help */}
        <div className={`mt-12 rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h3 className="text-xl font-bold mb-2">Need More Help?</h3>
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Can't find what you're looking for? We're here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                View Documentation
              </button>
              <button className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
                Contact Support
              </button>
              <button className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                Video Tutorials
              </button>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className={`mt-6 rounded-xl p-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        } border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-bold mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Support Email</p>
              <p className="font-medium">support@tanisha-enterprise.com</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Support Phone</p>
              <p className="font-medium">+880 1234 567890</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Business Hours</p>
              <p className="font-medium">9:00 AM - 6:00 PM (Sat-Thu)</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Response Time</p>
              <p className="font-medium">Within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpFAQ;