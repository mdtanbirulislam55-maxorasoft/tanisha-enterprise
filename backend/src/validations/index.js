const Joi = require('joi');

// Auth validations
const authValidation = {
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('ADMIN', 'ACCOUNTANT', 'STOCK_MANAGER', 'SALES', 'VIEWER').required(),
    branch_id: Joi.string().optional(),
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
  }),
};

// Account validations
const accountValidation = {
  createAccountHead: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    type: Joi.string().valid('Asset', 'Liability', 'Equity', 'Revenue', 'Expense').required(),
    group_id: Joi.string().optional(),
    opening_balance: Joi.number().precision(2).default(0),
    is_active: Joi.boolean().default(true),
  }),
  
  createTransaction: Joi.object({
    date: Joi.date().default(Date.now),
    debit_account_id: Joi.string().required(),
    credit_account_id: Joi.string().required(),
    amount: Joi.number().positive().precision(2).required(),
    branch_id: Joi.string().required(),
    reference: Joi.string().max(200).optional(),
    notes: Joi.string().max(500).optional(),
  }),
  
  createAccountGroup: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    description: Joi.string().optional(),
    parent_id: Joi.string().optional(),
  }),
};

// Product validations
const productValidation = {
  createProduct: Joi.object({
    sku: Joi.string().min(2).max(50).required(),
    name: Joi.string().min(2).max(200).required(),
    unit_id: Joi.string().required(),
    group_id: Joi.string().optional(),
    cost_price: Joi.number().positive().precision(2).required(),
    sell_price: Joi.number().positive().precision(2).required(),
    tax_rate: Joi.number().min(0).max(100).precision(2).default(0),
    min_stock: Joi.number().integer().min(0).default(0),
    current_stock: Joi.number().precision(2).default(0),
    is_active: Joi.boolean().default(true),
  }),
  
  updateProduct: Joi.object({
    name: Joi.string().min(2).max(200).optional(),
    unit_id: Joi.string().optional(),
    group_id: Joi.string().optional(),
    cost_price: Joi.number().positive().precision(2).optional(),
    sell_price: Joi.number().positive().precision(2).optional(),
    tax_rate: Joi.number().min(0).max(100).precision(2).optional(),
    min_stock: Joi.number().integer().min(0).optional(),
    is_active: Joi.boolean().optional(),
  }),
};

// Sale validations
const saleValidation = {
  createSale: Joi.object({
    customer_id: Joi.string().required(),
    branch_id: Joi.string().required(),
    warehouse_id: Joi.string().required(),
    date: Joi.date().default(Date.now),
    items: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.string().required(),
          quantity: Joi.number().positive().precision(3).required(),
          unit_price: Joi.number().positive().precision(2).required(),
        })
      )
      .min(1)
      .required(),
    discount_amount: Joi.number().min(0).precision(2).default(0),
    payment_method: Joi.string().valid('CASH', 'BANK', 'CHEQUE', 'MOBILE').required(),
    paid_amount: Joi.number().min(0).precision(2).required(),
    notes: Joi.string().max(500).optional(),
  }),
  
  createCustomer: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    contact_person: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    opening_balance: Joi.number().precision(2).default(0),
    credit_limit: Joi.number().min(0).precision(2).default(0),
    is_active: Joi.boolean().default(true),
  }),
};

// Purchase validations
const purchaseValidation = {
  createPurchase: Joi.object({
    supplier_id: Joi.string().required(),
    branch_id: Joi.string().required(),
    warehouse_id: Joi.string().required(),
    date: Joi.date().default(Date.now),
    items: Joi.array()
      .items(
        Joi.object({
          product_id: Joi.string().required(),
          quantity: Joi.number().positive().precision(3).required(),
          unit_price: Joi.number().positive().precision(2).required(),
        })
      )
      .min(1)
      .required(),
    discount_amount: Joi.number().min(0).precision(2).default(0),
    notes: Joi.string().max(500).optional(),
  }),
  
  createSupplier: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().min(2).max(20).required(),
    contact_person: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
    opening_balance: Joi.number().precision(2).default(0),
    is_active: Joi.boolean().default(true),
  }),
};

// Report validations
const reportValidation = {
  generateReport: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    branch_id: Joi.string().optional(),
    customer_id: Joi.string().optional(),
    supplier_id: Joi.string().optional(),
    product_id: Joi.string().optional(),
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
  }),
};

// Stock validations
const stockValidation = {
  stockTransfer: Joi.object({
    from_warehouse_id: Joi.string().required(),
    to_warehouse_id: Joi.string().required(),
    product_id: Joi.string().required(),
    quantity: Joi.number().positive().precision(3).required(),
    date: Joi.date().default(Date.now),
    notes: Joi.string().optional(),
  }),
  
  stockAdjustment: Joi.object({
    warehouse_id: Joi.string().required(),
    product_id: Joi.string().required(),
    adjustment_type: Joi.string().valid('IN', 'OUT').required(),
    quantity: Joi.number().positive().precision(3).required(),
    reason: Joi.string().required(),
    date: Joi.date().default(Date.now),
    notes: Joi.string().optional(),
  }),
};

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    req.body = value;
    next();
  };
};

module.exports = {
  authValidation,
  accountValidation,
  productValidation,
  saleValidation,
  purchaseValidation,
  reportValidation,
  stockValidation,
  validateRequest,
};