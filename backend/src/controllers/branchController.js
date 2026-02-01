const prisma = require('../lib/prisma');

const toInt = (v) => Number.parseInt(v, 10);

exports.getBranches = async (req, res) => {
  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, data: branches });
};

exports.getBranchById = async (req, res) => {
  const id = toInt(req.params.id);
  const branch = await prisma.branch.findUnique({ where: { id } });
  if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
  res.json({ success: true, data: branch });
};

exports.createBranch = async (req, res) => {
  const { code, name, address, phone, email, isActive } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, message: 'code and name are required' });

  const created = await prisma.branch.create({
    data: {
      code,
      name,
      address: address || null,
      phone: phone || null,
      email: email || null,
      isActive: typeof isActive === 'boolean' ? isActive : true,
    },
  });
  res.status(201).json({ success: true, message: 'Branch created', data: created });
};

exports.updateBranch = async (req, res) => {
  const id = toInt(req.params.id);
  const { code, name, address, phone, email, isActive } = req.body;

  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ success: false, message: 'Branch not found' });

  const updated = await prisma.branch.update({
    where: { id },
    data: {
      code: code ?? undefined,
      name: name ?? undefined,
      address: address ?? undefined,
      phone: phone ?? undefined,
      email: email ?? undefined,
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    },
  });

  res.json({ success: true, message: 'Branch updated', data: updated });
};

exports.deleteBranch = async (req, res) => {
  const id = toInt(req.params.id);

  // Soft guard: prevent deleting main branch id=1
  if (id === 1) return res.status(400).json({ success: false, message: 'Main branch cannot be deleted' });

  const existing = await prisma.branch.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ success: false, message: 'Branch not found' });

  await prisma.branch.delete({ where: { id } });
  res.json({ success: true, message: 'Branch deleted' });
};

// ==================== SETTINGS / STATUS ====================

exports.updateBranchStatus = async (req, res) => {
  const id = toInt(req.params.id);
  const { isActive } = req.body;

  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ success: false, message: 'isActive must be boolean' });
  }

  const updated = await prisma.branch.update({ where: { id }, data: { isActive } });
  res.json({ success: true, message: 'Branch status updated', data: updated });
};

exports.updateBranchSettings = async (req, res) => {
  // Branch settings are stored in CompanySetting (per-branch) or SystemConfig.
  // For now, update CompanySetting for this branch.
  const id = toInt(req.params.id);

  const {
    companyName,
    companyNameBn,
    tradeLicense,
    tin,
    bin,
    vatRegNo,
    address,
    addressBn,
    phone,
    phone2,
    email,
    website,
    businessType,
    currency,
    currencySymbol,
    vatRate,
    logo,
    financialYearStart,
    financialYearEnd,
  } = req.body || {};

  const existingBranch = await prisma.branch.findUnique({ where: { id } });
  if (!existingBranch) return res.status(404).json({ success: false, message: 'Branch not found' });

  const updated = await prisma.companySetting.upsert({
    where: { branchId: id },
    update: {
      companyName,
      companyNameBn,
      tradeLicense,
      tin,
      bin,
      vatRegNo,
      address,
      addressBn,
      phone,
      phone2,
      email,
      website,
      businessType,
      currency,
      currencySymbol,
      vatRate,
      logo,
      financialYearStart,
      financialYearEnd,
    },
    create: {
      branchId: id,
      companyName: companyName || existingBranch.name,
      companyNameBn: companyNameBn || null,
      tradeLicense: tradeLicense || null,
      tin: tin || null,
      bin: bin || null,
      vatRegNo: vatRegNo || null,
      address: address || null,
      addressBn: addressBn || null,
      phone: phone || null,
      phone2: phone2 || null,
      email: email || null,
      website: website || null,
      businessType: businessType || null,
      currency: currency || 'BDT',
      currencySymbol: currencySymbol || '৳',
      vatRate: vatRate ?? undefined,
      logo: logo || null,
      financialYearStart: financialYearStart || undefined,
      financialYearEnd: financialYearEnd || undefined,
    },
  });

  res.json({ success: true, message: 'Branch settings updated', data: updated });
};

exports.setDefaultBranch = async (req, res) => {
  // There is no isDefault on Branch in schema.
  // We store default branch in SystemConfig.key = 'default_branch_id'
  const id = toInt(req.params.id);

  const existingBranch = await prisma.branch.findUnique({ where: { id } });
  if (!existingBranch) return res.status(404).json({ success: false, message: 'Branch not found' });

  const row = await prisma.systemConfig.upsert({
    where: { key: 'default_branch_id' },
    update: { value: String(id), type: 'number' },
    create: { key: 'default_branch_id', value: String(id), type: 'number' },
  });

  res.json({ success: true, message: 'Default branch updated', data: { defaultBranchId: Number(row.value) } });
};

// ==================== STATS (BASIC) ====================

exports.getBranchStats = async (req, res) => {
  const id = toInt(req.params.id);

  const [customers, products, sales, purchases] = await Promise.all([
    prisma.customer.count({ where: { branchId: id } }).catch(() => 0),
    prisma.product.count({ where: { branchId: id } }).catch(() => 0),
    prisma.sale.count({ where: { branchId: id } }).catch(() => 0),
    prisma.purchase.count({ where: { branchId: id } }).catch(() => 0),
  ]);

  res.json({
    success: true,
    data: { branchId: id, customers, products, sales, purchases },
  });
};

exports.getBranchPerformance = async (req, res) => {
  const id = toInt(req.params.id);

  const totals = await prisma.sale.aggregate({
    where: { branchId: id, status: 'completed' },
    _sum: { totalAmount: true, paidAmount: true, dueAmount: true },
    _count: { id: true },
  });

  res.json({
    success: true,
    data: {
      branchId: id,
      salesCount: totals._count.id || 0,
      totalAmount: totals._sum.totalAmount || 0,
      paidAmount: totals._sum.paidAmount || 0,
      dueAmount: totals._sum.dueAmount || 0,
    },
  });
};

exports.compareBranches = async (req, res) => {
  const branches = await prisma.branch.findMany({
    select: { id: true, code: true, name: true, isActive: true },
    orderBy: { name: 'asc' },
  });

  res.json({ success: true, data: branches });
};

// ==================== TRANSFER / SYNC (PLACEHOLDERS) ====================

exports.transferData = async (req, res) => {
  // Production implementation needs explicit business rules.
  res.status(501).json({ success: false, message: 'Branch data transfer is not implemented yet' });
};

exports.syncBranches = async (req, res) => {
  res.status(501).json({ success: false, message: 'Branch sync is not implemented yet' });
};
