const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ==================== CREATE MAIN BRANCH ====================
  const mainBranch = await prisma.branch.create({
    data: {
      code: 'DHA-001',
      name: 'Main Branch - Dhaka',
      address: 'Shop-14, Floor-1, Mohammadia Machinery Market, 176 No Nawabpur Road, Dhaka 1100',
      phone: '+880 1707-073769',
      email: 'dhaka@tanisha.com',
      isActive: true
    }
  });

  console.log('✅ Created branch:', mainBranch.name);

  // ==================== CREATE CATEGORIES ====================
  const categories = [
    { code: 'FOGGER', name: 'Fogger Machine', description: 'Agricultural fogger machines' },
    { code: 'GRASS-CUTTER', name: 'Grass Cutter', description: 'Grass cutting equipment' },
    { code: 'OIL', name: 'Fogger Oil', description: 'Oils and lubricants' },
    { code: 'SPARE', name: 'Spare Parts', description: 'Machine spare parts' },
    { code: 'LAWN', name: 'Lawn Mower', description: 'Lawn maintenance equipment' },
    { code: 'GENERATOR', name: 'Generator', description: 'Power generators' },
    { code: 'PUMP', name: 'Water Pump', description: 'Agricultural water pumps' },
    { code: 'TRACTOR', name: 'Tractor Parts', description: 'Tractor accessories and parts' }
  ];

  const createdCategories = {};
  for (const catData of categories) {
    const category = await prisma.category.create({
      data: catData
    });
    createdCategories[catData.code] = category;
    console.log(`✅ Created category: ${category.name}`);
  }

  // ==================== CREATE DEMO USERS ====================
  const demoPassword = await bcrypt.hash('tanisha123', 10);
  
  const demoUsers = [
    {
      username: 'admin',
      email: 'admin@tanisha.com',
      password: demoPassword,
      fullName: 'Admin User',
      phone: '+880 1707-073769',
      role: 'admin',
      designation: 'System Administrator',
      branchId: mainBranch.id,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'accountant',
      email: 'accountant@tanisha.com',
      password: demoPassword,
      fullName: 'Accountant User',
      phone: '+880 1707-073769',
      role: 'accountant',
      designation: 'Chief Accountant',
      branchId: mainBranch.id,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'manager',
      email: 'manager@tanisha.com',
      password: demoPassword,
      fullName: 'Manager User',
      phone: '+880 1707-073769',
      role: 'manager',
      designation: 'Branch Manager',
      branchId: mainBranch.id,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'sales',
      email: 'sales@tanisha.com',
      password: demoPassword,
      fullName: 'Sales Executive',
      phone: '+880 1707-073769',
      role: 'staff',
      designation: 'Sales Executive',
      branchId: mainBranch.id,
      isActive: true,
      emailVerified: true
    },
    {
      username: 'service',
      email: 'service@tanisha.com',
      password: demoPassword,
      fullName: 'Service Technician',
      phone: '+880 1707-073769',
      role: 'staff',
      designation: 'Service Technician',
      branchId: mainBranch.id,
      isActive: true,
      emailVerified: true
    }
  ];

  const createdUsers = {};
  for (const userData of demoUsers) {
    const user = await prisma.user.create({
      data: userData
    });
    createdUsers[userData.role] = user;
    console.log(`✅ Created user: ${user.fullName} (${user.role})`);
  }

  // ==================== CREATE SAMPLE PRODUCTS ====================
  const products = [
    {
      code: 'FOG-001',
      name: 'Fogger Machine - Professional Model',
      description: 'Agricultural fogger machine for pest control with 2-stroke engine',
      categoryId: createdCategories['FOGGER'].id,
      brand: 'Tanisha',
      model: 'TF-2000',
      origin: 'China',
      unit: 'Piece',
      costPrice: 8500.00,
      sellPrice: 12000.00,
      wholesalePrice: 11000.00,
      minPrice: 10500.00,
      taxRate: 15.00,
      hasVAT: true,
      openingStock: 15.00,
      currentStock: 15.00,
      reservedStock: 0.00,
      reorderLevel: 5.00,
      alertQuantity: 2.00,
      hasBatch: false,
      hasSerial: true,
      hasExpiry: false,
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'GC-001',
      name: 'Grass Cutter - Heavy Duty',
      description: 'Gasoline powered grass cutting machine with metal blades',
      categoryId: createdCategories['GRASS-CUTTER'].id,
      brand: 'Tanisha',
      model: 'TC-500',
      origin: 'Japan',
      unit: 'Piece',
      costPrice: 7500.00,
      sellPrice: 10500.00,
      wholesalePrice: 9800.00,
      minPrice: 9500.00,
      taxRate: 15.00,
      hasVAT: true,
      openingStock: 12.00,
      currentStock: 12.00,
      reservedStock: 0.00,
      reorderLevel: 4.00,
      alertQuantity: 2.00,
      hasBatch: false,
      hasSerial: true,
      hasExpiry: false,
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'FO-001',
      name: 'Fogger Oil - Premium Grade',
      description: 'Special oil for fogger machines, 1 liter bottle',
      categoryId: createdCategories['OIL'].id,
      brand: 'Tanisha',
      model: 'TO-100',
      origin: 'Bangladesh',
      unit: 'Liter',
      costPrice: 350.00,
      sellPrice: 500.00,
      wholesalePrice: 450.00,
      minPrice: 420.00,
      taxRate: 0.00,
      hasVAT: false,
      openingStock: 100.00,
      currentStock: 100.00,
      reservedStock: 0.00,
      reorderLevel: 20.00,
      alertQuantity: 10.00,
      hasBatch: true,
      hasSerial: false,
      hasExpiry: true,
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'SP-001',
      name: 'Spare Parts Kit - Universal',
      description: 'Essential spare parts for maintenance including spark plugs, filters, and cables',
      categoryId: createdCategories['SPARE'].id,
      brand: 'Tanisha',
      model: 'TSK-50',
      origin: 'China',
      unit: 'Set',
      costPrice: 1200.00,
      sellPrice: 1800.00,
      wholesalePrice: 1600.00,
      minPrice: 1500.00,
      taxRate: 15.00,
      hasVAT: true,
      openingStock: 25.00,
      currentStock: 25.00,
      reservedStock: 0.00,
      reorderLevel: 10.00,
      alertQuantity: 5.00,
      hasBatch: true,
      hasSerial: false,
      hasExpiry: false,
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'GEN-001',
      name: 'Generator - 5KVA Diesel',
      description: 'Portable power generator 5KVA with automatic voltage regulator',
      categoryId: createdCategories['GENERATOR'].id,
      brand: 'Tanisha',
      model: 'TG-5000',
      origin: 'China',
      unit: 'Piece',
      costPrice: 45000.00,
      sellPrice: 65000.00,
      wholesalePrice: 60000.00,
      minPrice: 58000.00,
      taxRate: 15.00,
      hasVAT: true,
      openingStock: 6.00,
      currentStock: 6.00,
      reservedStock: 0.00,
      reorderLevel: 2.00,
      alertQuantity: 1.00,
      hasBatch: false,
      hasSerial: true,
      hasExpiry: false,
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'WP-001',
      name: 'Water Pump - 2 HP',
      description: 'Agricultural water pump 2 horsepower with diesel engine',
      categoryId: createdCategories['PUMP'].id,
      brand: 'Tanisha',
      model: 'TWP-200',
      origin: 'India',
      unit: 'Piece',
      costPrice: 22000.00,
      sellPrice: 32000.00,
      wholesalePrice: 30000.00,
      minPrice: 29000.00,
      taxRate: 15.00,
      hasVAT: true,
      openingStock: 8.00,
      currentStock: 8.00,
      reservedStock: 0.00,
      reorderLevel: 3.00,
      alertQuantity: 1.00,
      hasBatch: false,
      hasSerial: true,
      hasExpiry: false,
      isActive: true,
      branchId: mainBranch.id
    }
  ];

  const createdProducts = {};
  for (const productData of products) {
    const product = await prisma.product.create({
      data: productData
    });
    createdProducts[product.code] = product;
    console.log(`✅ Created product: ${product.name}`);
  }

  // ==================== CREATE SAMPLE CUSTOMERS ====================
  const customers = [
    {
      code: 'CUST-001',
      name: 'Abdul Karim',
      type: 'individual',
      phone: '+880 1707-073769',
      email: 'karim.farm@gmail.com',
      address: 'Vill: Shyampur, Post: Shyampur, Upazila: Kaligonj',
      district: 'Satkhira',
      division: 'Khulna',
      openingBalance: 0.00,
      currentBalance: 0.00,
      creditLimit: 50000.00,
      creditDays: 30,
      businessType: 'farm',
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'CUST-002',
      name: 'Green Valley Agriculture Ltd.',
      type: 'company',
      company: 'Green Valley Agriculture Limited',
      phone: '+880 1707-073769',
      email: 'info@greenvalley.com',
      address: 'House# 45, Road# 11, Banani',
      district: 'Dhaka',
      division: 'Dhaka',
      openingBalance: 25000.00,
      currentBalance: 25000.00,
      creditLimit: 200000.00,
      creditDays: 45,
      businessType: 'corporate_farm',
      tradeLicense: 'TRD-789456',
      tin: '123456789',
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'CUST-003',
      name: 'Nursery & Garden Care',
      type: 'company',
      company: 'Nursery & Garden Care',
      phone: '+880 1707-073769',
      email: 'nurserycare@yahoo.com',
      address: 'Station Road, Savar',
      district: 'Dhaka',
      division: 'Dhaka',
      openingBalance: 15000.00,
      currentBalance: 15000.00,
      creditLimit: 100000.00,
      creditDays: 30,
      businessType: 'nursery',
      isActive: true,
      branchId: mainBranch.id
    }
  ];

  for (const customerData of customers) {
    const customer = await prisma.customer.create({
      data: customerData
    });
    console.log(`✅ Created customer: ${customer.name}`);
  }

  // ==================== CREATE SAMPLE SUPPLIERS ====================
  const suppliers = [
    {
      code: 'SUPP-001',
      name: 'China Machinery Imports Ltd.',
      company: 'China Machinery Imports Limited',
      contactPerson: 'Mr. Zhang Wei',
      phone: '+880 1707-073769',
      email: 'zhang@chinamachinery.com',
      address: 'Kawran Bazar, Dhaka',
      city: 'Dhaka',
      country: 'Bangladesh',
      openingBalance: 0.00,
      currentBalance: 0.00,
      supplierType: 'importer',
      vatRegNo: 'VAT-001234',
      isActive: true,
      branchId: mainBranch.id
    },
    {
      code: 'SUPP-002',
      name: 'Local Parts Manufacturer',
      company: 'Local Parts Manufacturing Co.',
      contactPerson: 'Mr. Rahim Khan',
      phone: '+880 1707-073769',
      email: 'rahim@localparts.com',
      address: 'Tongi Industrial Area, Gazipur',
      city: 'Gazipur',
      country: 'Bangladesh',
      openingBalance: 0.00,
      currentBalance: 0.00,
      supplierType: 'manufacturer',
      isActive: true,
      branchId: mainBranch.id
    }
  ];

  for (const supplierData of suppliers) {
    const supplier = await prisma.supplier.create({
      data: supplierData
    });
    console.log(`✅ Created supplier: ${supplier.name}`);
  }

  // ==================== CREATE WAREHOUSE ====================
  const warehouse = await prisma.warehouse.create({
    data: {
      code: 'WH-001',
      name: 'Main Warehouse - Dhaka',
      branchId: mainBranch.id,
      address: 'Same as branch address',
      isActive: true
    }
  });
  console.log(`✅ Created warehouse: ${warehouse.name}`);

  // ==================== CREATE COMPANY SETTINGS ====================
  const companySettings = await prisma.companySetting.create({
    data: {
      companyName: 'Tanisha Enterprise',
      companyNameBn: 'তানিশা এন্টারপ্রাইজ',
      tradeLicense: 'TRD-123456',
      tin: '987654321',
      bin: 'BIN-123456',
      vatRegNo: 'VAT-789012',
      address: 'Shop-14, Floor-1, Mohammadia Machinery Market, 176 No Nawabpur Road, Dhaka 1100',
      addressBn: 'দোকান-১৪, তলা-১, মোহাম্মদিয়া মেশিনারী মার্কেট, ১৭৬ নং নবাবপুর রোড, ঢাকা ১১০০',
      phone: '+880 1707-073769',
      phone2: '+880 1707-073769',
      email: 'info@tanisha.com',
      website: 'www.tanisha-enterprise.com',
      businessType: 'Machinery Trading & Service',
      currency: 'BDT',
      currencySymbol: '৳',
      vatRate: 15.00,
      logo: 'logo.png',
      financialYearStart: '07-01',
      financialYearEnd: '06-30',
      branchId: mainBranch.id
    }
  });
  console.log(`✅ Created company settings for: ${companySettings.companyName}`);

  // ==================== CREATE BASIC SYSTEM CONFIG ====================
  const systemConfigs = [
    { key: 'app_name', value: 'Tanisha Enterprise Management System', type: 'string', category: 'general' },
    { key: 'app_version', value: '1.0.0', type: 'string', category: 'general' },
    { key: 'default_currency', value: 'BDT', type: 'string', category: 'financial' },
    { key: 'default_vat_rate', value: '15', type: 'number', category: 'financial' },
    { key: 'invoice_prefix', value: 'TAN', type: 'string', category: 'sales' },
    { key: 'purchase_prefix', value: 'PO', type: 'string', category: 'purchase' },
    { key: 'low_stock_threshold', value: '5', type: 'number', category: 'inventory' },
    { key: 'company_logo', value: '/uploads/logo.png', type: 'string', category: 'general' },
    { key: 'enable_email_notifications', value: 'true', type: 'boolean', category: 'notifications' },
    { key: 'enable_sms_notifications', value: 'false', type: 'boolean', category: 'notifications' },
    { key: 'company_phone', value: '+880 1707-073769', type: 'string', category: 'contact' },
    { key: 'company_email', value: 'info@tanisha.com', type: 'string', category: 'contact' },
    { key: 'company_address', value: 'Shop-14, Floor-1, Mohammadia Machinery Market, 176 No Nawabpur Road, Dhaka 1100', type: 'string', category: 'contact' }
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.create({
      data: config
    });
    console.log(`✅ Created config: ${config.key}`);
  }

  // ==================== CREATE ACCOUNT HEADS ====================
  const accountHeads = [
    {
      code: '1001',
      name: 'Cash in Hand',
      nameBn: 'নগদ টাকা',
      type: 'Asset',
      category: 'Current Asset',
      subCategory: 'Cash',
      openingBalance: 500000.00,
      currentBalance: 500000.00,
      balanceType: 'debit',
      isActive: true,
      isSystem: true,
      isCash: true,
      isBank: false,
      branchId: mainBranch.id
    },
    {
      code: '1002',
      name: 'Bank Account',
      nameBn: 'ব্যাংক হিসাব',
      type: 'Asset',
      category: 'Current Asset',
      subCategory: 'Bank',
      openingBalance: 2000000.00,
      currentBalance: 2000000.00,
      balanceType: 'debit',
      isActive: true,
      isSystem: true,
      isCash: false,
      isBank: true,
      branchId: mainBranch.id
    },
    {
      code: '2001',
      name: 'Accounts Payable',
      nameBn: 'প্রদেয় হিসাব',
      type: 'Liability',
      category: 'Current Liability',
      subCategory: 'Payable',
      openingBalance: 0.00,
      currentBalance: 0.00,
      balanceType: 'credit',
      isActive: true,
      isSystem: true,
      isCash: false,
      isBank: false,
      branchId: mainBranch.id
    },
    {
      code: '3001',
      name: 'Sales Revenue',
      nameBn: 'বিক্রয় আয়',
      type: 'Income',
      category: 'Operating Revenue',
      subCategory: 'Sales',
      openingBalance: 0.00,
      currentBalance: 0.00,
      balanceType: 'credit',
      isActive: true,
      isSystem: true,
      isCash: false,
      isBank: false,
      branchId: mainBranch.id
    },
    {
      code: '4001',
      name: 'Purchase Expense',
      nameBn: 'ক্রয় ব্যয়',
      type: 'Expense',
      category: 'Cost of Goods Sold',
      subCategory: 'Purchase',
      openingBalance: 0.00,
      currentBalance: 0.00,
      balanceType: 'debit',
      isActive: true,
      isSystem: true,
      isCash: false,
      isBank: false,
      branchId: mainBranch.id
    }
  ];

  for (const accountData of accountHeads) {
    await prisma.accountHead.create({
      data: accountData
    });
    console.log(`✅ Created account head: ${accountData.name}`);
  }

  console.log('=========================================');
  console.log('🌱 Seed completed successfully!');
  console.log('=========================================');
  console.log('📋 Summary:');
  console.log(`   • Branches: 1`);
  console.log(`   • Users: ${demoUsers.length}`);
  console.log(`   • Categories: ${categories.length}`);
  console.log(`   • Products: ${products.length}`);
  console.log(`   • Customers: ${customers.length}`);
  console.log(`   • Suppliers: ${suppliers.length}`);
  console.log(`   • Account Heads: ${accountHeads.length}`);
  console.log(`   • Warehouse: 1`);
  console.log(`   • Company Settings: 1`);
  console.log(`   • System Configs: ${systemConfigs.length}`);
  console.log('=========================================');
  console.log('🔑 Default Login Credentials:');
  console.log('   • Admin: admin@tanisha.com / tanisha123');
  console.log('   • Accountant: accountant@tanisha.com / tanisha123');
  console.log('   • Manager: manager@tanisha.com / tanisha123');
  console.log('   • Sales: sales@tanisha.com / tanisha123');
  console.log('   • Service: service@tanisha.com / tanisha123');
  console.log('=========================================');
  console.log('📞 Contact: +880 1707-073769');
  console.log('📧 Email: info@tanisha.com');
  console.log('🏢 Address: Shop-14, Floor-1, Mohammadia Machinery Market, 176 No Nawabpur Road, Dhaka 1100');
  console.log('=========================================');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });