import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    dashboard: "Dashboard",
    sales: "Sales",
    purchase: "Purchase",
    customers: "Customers",
    products: "Products",
    suppliers: "Suppliers",
    accounts: "Accounts",
    stock: "Stock",
    reports: "Reports",
    settings: "Settings",
    createSale: "Create Sale",
    salesList: "Sales List",
    salesReturn: "Sales Return",
    salesReport: "Sales Report",
    createPurchase: "Create Purchase",
    purchaseList: "Purchase List",
    purchaseReturn: "Purchase Return",
    purchaseReport: "Purchase Report",
    customerList: "Customer List",
    addCustomer: "Add Customer",
    customerLedger: "Customer Ledger",
    productList: "Product List",
    addProduct: "Add Product",
    categories: "Categories",
    brands: "Brands",
    chartOfAccounts: "Chart of Accounts",
    journalEntry: "Journal Entry",
    trialBalance: "Trial Balance",
    profitLoss: "Profit & Loss",
    balanceSheet: "Balance Sheet",
    currentStock: "Current Stock",
    stockAdjustment: "Stock Adjustment",
    stockTransfer: "Stock Transfer",
    stockReport: "Stock Report",
    salesReports: "Sales Reports",
    purchaseReports: "Purchase Reports",
    inventoryReports: "Inventory Reports",
    financialReports: "Financial Reports",
    companySettings: "Company Settings",
    userManagement: "User Management",
    branchManagement: "Branch Management",
    backupRestore: "Backup & Restore"
  },
  bn: {
    dashboard: "ড্যাশবোর্ড",
    sales: "বিক্রয়",
    purchase: "ক্রয়",
    customers: "গ্রাহক",
    products: "পণ্য",
    suppliers: "সরবরাহকারী",
    accounts: "হিসাব",
    stock: "স্টক",
    reports: "রিপোর্ট",
    settings: "সেটিংস",
    createSale: "বিক্রয় তৈরি করুন",
    salesList: "বিক্রয় তালিকা",
    salesReturn: "বিক্রয় ফেরত",
    salesReport: "বিক্রয় রিপোর্ট",
    createPurchase: "ক্রয় তৈরি করুন",
    purchaseList: "ক্রয় তালিকা",
    purchaseReturn: "ক্রয় ফেরত",
    purchaseReport: "ক্রয় রিপোর্ট",
    customerList: "গ্রাহক তালিকা",
    addCustomer: "গ্রাহক যোগ করুন",
    customerLedger: "গ্রাহক লেজার",
    productList: "পণ্য তালিকা",
    addProduct: "পণ্য যোগ করুন",
    categories: "ক্যাটাগরি",
    brands: "ব্র্যান্ড",
    chartOfAccounts: "হিসাবের চার্ট",
    journalEntry: "জার্নাল এন্ট্রি",
    trialBalance: "ট্রায়াল ব্যালেন্স",
    profitLoss: "লাভ-ক্ষতি",
    balanceSheet: "ব্যালেন্স শীট",
    currentStock: "বর্তমান স্টক",
    stockAdjustment: "স্টক সমন্বয়",
    stockTransfer: "স্টক স্থানান্তর",
    stockReport: "স্টক রিপোর্ট",
    salesReports: "বিক্রয় রিপোর্ট",
    purchaseReports: "ক্রয় রিপোর্ট",
    inventoryReports: "ইনভেন্টরি রিপোর্ট",
    financialReports: "আর্থিক রিপোর্ট",
    companySettings: "কোম্পানি সেটিংস",
    userManagement: "ব্যবহারকারী ব্যবস্থাপনা",
    branchManagement: "শাখা ব্যবস্থাপনা",
    backupRestore: "ব্যাকআপ ও পুনরুদ্ধার"
  }
};

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLang = localStorage.getItem('language');
    return savedLang || 'en';
  });

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key, fallback) => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
