const prisma = require('../lib/prisma');

/**
 * Category Controller (Production-ready CRUD)
 * Model: Category
 */

const parsePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || '50', 10), 1), 200);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

exports.getCategories = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req);
    const search = String(req.query.search || '').trim();
    const isActive = req.query.isActive;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive === 'true') where.isActive = true;
    if (isActive === 'false') where.isActive = false;

    const [items, total] = await Promise.all([
      prisma.category.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.category.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getCategories error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    return res.json({ success: true, data: category });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('getCategoryById error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description = '', isActive = true } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: {
        name: String(name).trim(),
        description: String(description || '').trim(),
        isActive: Boolean(isActive),
      },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Category name already exists' });
    }
    // eslint-disable-next-line no-console
    console.error('createCategory error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create category' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, isActive } = req.body || {};

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name: String(name).trim() } : {}),
        ...(description !== undefined ? { description: String(description || '').trim() } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return res.json({ success: true, data: category });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'Category name already exists' });
    }
    // eslint-disable-next-line no-console
    console.error('updateCategory error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update category' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    await prisma.category.delete({ where: { id } });

    return res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('deleteCategory error:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
};
