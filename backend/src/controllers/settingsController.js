const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const prisma = require('../lib/prisma');

// -------------------- helpers --------------------
const getBranchId = (req) => req.user?.branchId || 1;

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

const SETTINGS_DIR = path.resolve(process.env.SETTINGS_PATH || './data/settings');

const readJsonIfExists = (filePath, fallback) => {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJson = (filePath, data) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const backupsDir = () => {
  // default: backend/backups
  const p = process.env.BACKUP_PATH || './backups';
  return path.isAbsolute(p) ? p : path.join(process.cwd(), p);
};

const safeJson = (obj) => JSON.parse(JSON.stringify(obj));

// ==================== COMPANY SETTINGS ====================
// Stored in Branch table (since schema already has Branch fields)
exports.getCompanySettings = async (req, res) => {
  try {
    const branchId = getBranchId(req);

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!branch) {
      return res.status(404).json({ success: false, error: 'Branch not found' });
    }

    return res.status(200).json({ success: true, data: branch });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get company settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch company settings' });
  }
};

exports.updateCompanySettings = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const { name, address, phone, email, code, isActive } = req.body || {};

    const updated = await prisma.branch.update({
      where: { id: branchId },
      data: {
        ...(code !== undefined ? { code: String(code) } : {}),
        ...(name !== undefined ? { name: String(name) } : {}),
        ...(address !== undefined ? { address: address === null ? null : String(address) } : {}),
        ...(phone !== undefined ? { phone: phone === null ? null : String(phone) } : {}),
        ...(email !== undefined ? { email: email === null ? null : String(email) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
      select: {
        id: true,
        code: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ success: true, message: 'Company settings updated', data: updated });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update company settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update company settings' });
  }
};

// ==================== PRINT SETTINGS (FILE BASED) ====================
exports.getPrintSettings = async (req, res) => {
  try {
    const branchId = req.user?.branchId || 1;
    const fs = require('fs');
    const path = require('path');

    const SETTINGS_DIR = path.resolve('./data/settings');
    if (!fs.existsSync(SETTINGS_DIR)) fs.mkdirSync(SETTINGS_DIR, { recursive: true });

    const filePath = path.join(SETTINGS_DIR, `print_${branchId}.json`);

    const defaults = {
      invoiceHeader: process.env.COMPANY_NAME || 'Tanisha Enterprise',
      paperSize: 'A4',
      currency: 'BDT',
      showLogo: true,
      footerNote: 'Thank you for your business!',
    };

    const data = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : defaults;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Get print settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch print settings' });
  }
};

exports.updatePrintSettings = async (req, res) => {
  try {
    const branchId = req.user?.branchId || 1;
    const fs = require('fs');
    const path = require('path');

    const SETTINGS_DIR = path.resolve('./data/settings');
    if (!fs.existsSync(SETTINGS_DIR)) fs.mkdirSync(SETTINGS_DIR, { recursive: true });

    const filePath = path.join(SETTINGS_DIR, `print_${branchId}.json`);

    const updated = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');

    return res.status(200).json({
      success: true,
      message: 'Print settings updated',
      data: updated,
    });
  } catch (error) {
    console.error('Update print settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update print settings' });
  }
};

// ==================== USER MANAGEMENT ====================
exports.getUsers = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const { search = '', role, isActive, page = 1, limit = 20 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * take;

    const where = {
      branchId,
      ...(role ? { role: String(role) } : {}),
      ...(isActive !== undefined ? { isActive: String(isActive) === 'true' } : {}),
      ...(search
        ? {
            OR: [
              { username: { contains: String(search), mode: 'insensitive' } },
              { email: { contains: String(search), mode: 'insensitive' } },
              { fullName: { contains: String(search), mode: 'insensitive' } },
              { phone: { contains: String(search), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          phone: true,
          role: true,
          designation: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page, 10) || 1,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get users error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const { username, email, fullName, phone, password, role, designation, isActive } = req.body || {};

    if (!username || !email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        error: 'username, email, fullName and password are required',
      });
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: String(username) }, { email: String(email) }],
      },
      select: { id: true },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const user = await prisma.user.create({
      data: {
        username: String(username),
        email: String(email),
        fullName: String(fullName),
        phone: phone ? String(phone) : null,
        password: hashedPassword,
        role: role ? String(role) : 'staff',
        designation: designation ? String(designation) : null,
        isActive: isActive === undefined ? true : Boolean(isActive),
        branchId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        designation: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ success: true, message: 'User created', data: user });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid user id' });

    const { email, fullName, phone, role, designation, isActive, password } = req.body || {};

    const updateData = {
      ...(email !== undefined ? { email: String(email) } : {}),
      ...(fullName !== undefined ? { fullName: String(fullName) } : {}),
      ...(phone !== undefined ? { phone: phone ? String(phone) : null } : {}),
      ...(role !== undefined ? { role: String(role) } : {}),
      ...(designation !== undefined ? { designation: designation ? String(designation) : null } : {}),
      ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
    };

    if (password) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        designation: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ success: true, message: 'User updated', data: updated });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid user id' });

    // soft delete => isActive=false
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete user error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
};

// ==================== BRANCH MANAGEMENT ====================
exports.getBranches = async (req, res) => {
  try {
    const { search = '', isActive, page = 1, limit = 20 } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * take;

    const where = {
      ...(isActive !== undefined ? { isActive: String(isActive) === 'true' } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: String(search), mode: 'insensitive' } },
              { code: { contains: String(search), mode: 'insensitive' } },
              { address: { contains: String(search), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        orderBy: { id: 'asc' },
        skip,
        take,
      }),
      prisma.branch.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        branches,
        pagination: {
          page: parseInt(page, 10) || 1,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get branches error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch branches' });
  }
};

exports.createBranch = async (req, res) => {
  try {
    const { code, name, address, phone, email, isActive } = req.body || {};
    if (!code || !name) {
      return res.status(400).json({ success: false, error: 'code and name are required' });
    }

    const existing = await prisma.branch.findUnique({ where: { code: String(code) }, select: { id: true } });
    if (existing) return res.status(400).json({ success: false, error: 'Branch code already exists' });

    const branch = await prisma.branch.create({
      data: {
        code: String(code),
        name: String(name),
        address: address ? String(address) : null,
        phone: phone ? String(phone) : null,
        email: email ? String(email) : null,
        isActive: isActive === undefined ? true : Boolean(isActive),
      },
    });

    return res.status(201).json({ success: true, message: 'Branch created', data: branch });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create branch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create branch' });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid branch id' });
    const { code, name, address, phone, email, isActive } = req.body || {};

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(code !== undefined ? { code: String(code) } : {}),
        ...(name !== undefined ? { name: String(name) } : {}),
        ...(address !== undefined ? { address: address ? String(address) : null } : {}),
        ...(phone !== undefined ? { phone: phone ? String(phone) : null } : {}),
        ...(email !== undefined ? { email: email ? String(email) : null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return res.status(200).json({ success: true, message: 'Branch updated', data: branch });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update branch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update branch' });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ success: false, error: 'Invalid branch id' });

    // soft delete => isActive=false
    await prisma.branch.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ success: true, message: 'Branch deactivated' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete branch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete branch' });
  }
};

// ==================== BACKUPS (FILE-BASED, DB-SAFE) ====================
exports.createBackup = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    ensureDir(backupsDir());

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_branch_${branchId}_${timestamp}.json`;
    const filePath = path.join(backupsDir(), filename);

    // Export only tables that exist in schema
    const data = {
      meta: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        branchId,
      },
      branch: await prisma.branch.findUnique({ where: { id: branchId } }),
      users: await prisma.user.findMany({ where: { branchId } }),
      categories: await prisma.category.findMany({}),
      customers: await prisma.customer.findMany({ where: { branchId } }),
      suppliers: await prisma.supplier.findMany({ where: { branchId } }),
      products: await prisma.product.findMany({ where: { branchId } }),
      sales: await prisma.sale.findMany({ where: { branchId }, include: { saleItems: true } }),
      purchases: await prisma.purchase.findMany({ where: { branchId }, include: { purchaseItems: true } }),
      payments: await prisma.payment.findMany({ where: { branchId } }),
      serviceRequests: await prisma.serviceRequest.findMany({ where: { branchId } }).catch(() => []),
    };

    fs.writeFileSync(filePath, JSON.stringify(safeJson(data), null, 2), 'utf8');

    const stat = fs.statSync(filePath);
    return res.status(201).json({
      success: true,
      message: 'Backup created',
      data: {
        filename,
        size: stat.size,
        createdAt: data.meta.createdAt,
        downloadUrl: `/api/settings/backups/download/${encodeURIComponent(filename)}`,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Create backup error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create backup' });
  }
};

exports.getBackups = async (_req, res) => {
  try {
    ensureDir(backupsDir());
    const files = fs
      .readdirSync(backupsDir())
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const p = path.join(backupsDir(), f);
        const s = fs.statSync(p);
        return {
          filename: f,
          size: s.size,
          createdAt: s.birthtime?.toISOString?.() || s.ctime?.toISOString?.() || null,
          downloadUrl: `/api/settings/backups/download/${encodeURIComponent(f)}`,
        };
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    return res.status(200).json({ success: true, data: files });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get backups error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch backups' });
  }
};

exports.downloadBackup = async (req, res) => {
  try {
    ensureDir(backupsDir());
    const filename = req.params.filename;
    const filePath = path.join(backupsDir(), filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Download backup error:', error);
    return res.status(500).json({ success: false, error: 'Failed to download backup' });
  }
};

exports.restoreBackup = async (req, res) => {
  try {
    ensureDir(backupsDir());
    const filename = req.params.filename;
    const filePath = path.join(backupsDir(), filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Backup not found' });
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    const branchId = parsed?.meta?.branchId || getBranchId(req);

    // Restore with upserts (safe & idempotent)
    await prisma.$transaction(async (tx) => {
      if (parsed.branch?.id) {
        await tx.branch.upsert({
          where: { id: parsed.branch.id },
          update: {
            code: parsed.branch.code,
            name: parsed.branch.name,
            address: parsed.branch.address,
            phone: parsed.branch.phone,
            email: parsed.branch.email,
            isActive: parsed.branch.isActive,
          },
          create: {
            id: parsed.branch.id,
            code: parsed.branch.code,
            name: parsed.branch.name,
            address: parsed.branch.address,
            phone: parsed.branch.phone,
            email: parsed.branch.email,
            isActive: parsed.branch.isActive ?? true,
          },
        });
      }

      if (Array.isArray(parsed.categories)) {
        for (const c of parsed.categories) {
          if (!c?.code) continue;
          await tx.category.upsert({
            where: { code: c.code },
            update: { name: c.name, description: c.description, parentId: c.parentId, isActive: c.isActive },
            create: {
              code: c.code,
              name: c.name,
              description: c.description,
              parentId: c.parentId,
              isActive: c.isActive ?? true,
            },
          });
        }
      }

      // Users: restore as upsert by email (password preserved)
      if (Array.isArray(parsed.users)) {
        for (const u of parsed.users) {
          if (!u?.email || !u?.username) continue;
          await tx.user.upsert({
            where: { email: u.email },
            update: {
              username: u.username,
              fullName: u.fullName,
              phone: u.phone,
              role: u.role,
              designation: u.designation,
              isActive: u.isActive,
              branchId: u.branchId || branchId,
              password: u.password, // hashed
              emailVerified: u.emailVerified ?? false,
            },
            create: {
              username: u.username,
              email: u.email,
              password: u.password,
              fullName: u.fullName,
              phone: u.phone,
              role: u.role || 'staff',
              designation: u.designation,
              isActive: u.isActive ?? true,
              branchId: u.branchId || branchId,
              emailVerified: u.emailVerified ?? false,
            },
          });
        }
      }

      // Customers / Suppliers / Products: upsert by code
      const upsertByCode = async (model, row, extraCreate = {}) => {
        if (!row?.code) return;
        await model.upsert({
          where: { code: row.code },
          update: { ...row },
          create: { ...row, ...extraCreate },
        });
      };

      if (Array.isArray(parsed.customers)) {
        for (const c of parsed.customers) {
          await upsertByCode(tx.customer, { ...c, branchId: c.branchId || branchId });
        }
      }

      if (Array.isArray(parsed.suppliers)) {
        for (const s of parsed.suppliers) {
          await upsertByCode(tx.supplier, { ...s, branchId: s.branchId || branchId });
        }
      }

      if (Array.isArray(parsed.products)) {
        for (const p of parsed.products) {
          // categoryId must exist; skip if broken
          if (!p?.categoryId) continue;
          await tx.product.upsert({
            where: { code: p.code },
            update: { ...p, branchId: p.branchId || branchId },
            create: { ...p, branchId: p.branchId || branchId },
          });
        }
      }
    });

    return res.status(200).json({ success: true, message: 'Backup restored successfully' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Restore backup error:', error);
    return res.status(500).json({ success: false, error: 'Failed to restore backup' });
  }
};

exports.deleteBackup = async (req, res) => {
  try {
    ensureDir(backupsDir());
    const filename = req.params.filename;
    const filePath = path.join(backupsDir(), filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, error: 'Backup not found' });
    fs.unlinkSync(filePath);
    return res.status(200).json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Delete backup error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete backup' });
  }
};

// ==================== SYSTEM INFO ====================
exports.getSystemInfo = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const [customers, suppliers, products, sales, purchases, users] = await Promise.all([
      prisma.customer.count({ where: { branchId } }),
      prisma.supplier.count({ where: { branchId } }),
      prisma.product.count({ where: { branchId } }),
      prisma.sale.count({ where: { branchId } }),
      prisma.purchase.count({ where: { branchId } }),
      prisma.user.count({ where: { branchId } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        counts: { customers, suppliers, products, sales, purchases, users },
        node: { version: process.version, env: process.env.NODE_ENV || 'development' },
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('System info error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch system info' });
  }
};

// ==================== PRINT SETTINGS ====================
// Stored as JSON per-branch on disk to avoid additional DB tables.
exports.getPrintSettings = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    ensureDir(SETTINGS_DIR);
    const filePath = path.join(SETTINGS_DIR, `print_${branchId}.json`);

    const defaults = {
      invoiceHeader: process.env.COMPANY_NAME || 'Tanisha Enterprise',
      showLogo: false,
      paperSize: 'A4',
      currency: 'BDT',
      footerNote: 'Thank you for your business!',
    };

    const data = readJsonIfExists(filePath, defaults);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Get print settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch print settings' });
  }
};

exports.updatePrintSettings = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    ensureDir(SETTINGS_DIR);
    const filePath = path.join(SETTINGS_DIR, `print_${branchId}.json`);

    const current = readJsonIfExists(filePath, {});
    const next = { ...current, ...req.body, updatedAt: new Date().toISOString() };
    fs.writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf8');

    return res.status(200).json({ success: true, message: 'Print settings updated', data: next });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Update print settings error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update print settings' });
  }
};
