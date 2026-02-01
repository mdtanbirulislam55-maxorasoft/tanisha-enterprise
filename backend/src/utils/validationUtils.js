const Joi = require('joi');
const { AppError } = require('../middlewares/errorHandler');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new AppError('Validation failed', 400, errors));
    }

    req.body = value;
    next();
  };
};

const validationSchemas = {
  // Auth validations
  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required',
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  }),

  // Account validations
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

  // Product validations
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

  // Sale validations
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

  // Purchase validations
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

  // Report validations
  generateReport: Joi.object({
    start_date: Joi.date().required(),
    end_date: Joi.date().required(),
    branch_id: Joi.string().optional(),
    customer_id: Joi.string().optional(),
    supplier_id: Joi.string().optional(),
    product_id: Joi.string().optional(),
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
  }),

  // User validations
  createUser: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('ADMIN', 'ACCOUNTANT', 'STOCK_MANAGER', 'SALES', 'VIEWER').required(),
    branch_id: Joi.string().optional(),
  }),
};

// Custom validators
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
  return phoneRegex.test(phone);
};

const validateDecimal = (value, precision = 2) => {
  const decimalRegex = new RegExp(`^\\d+(\\.\\d{1,${precision}})?$`);
  return decimalRegex.test(value.toString());
};

module.exports = {
  validateRequest,
  validationSchemas,
  validateEmail,
  validatePhone,
  validateDecimal,
};