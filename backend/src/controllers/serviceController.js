const prisma = require('../lib/prisma');
const { generateServiceNumber } = require('../utils/dateUtils');

// ==================== SERVICE REQUESTS ====================

exports.createServiceRequest = async (req, res) => {
  try {
    const {
      customerId,
      machineId,
      machineType,
      serialNo,
      problemDescription,
      priority,
      serviceType,
      estimatedCost,
      estimatedTime,
      assignedTo,
      notes,
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId || 1;

    if (!customerId || !problemDescription) {
      return res.status(400).json({ success: false, error: 'Customer and problem description are required' });
    }

    const customer = await prisma.customer.findUnique({ where: { id: Number(customerId) } });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const serviceNo = generateServiceNumber('SRV');

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        serviceNo,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        machineId: machineId || null,
        machineType: machineType || null,
        serialNo: serialNo || null,
        problemDescription,
        priority: priority || 'medium',
        serviceType: serviceType || 'repair',
        estimatedCost: estimatedCost != null && estimatedCost !== '' ? Number(estimatedCost) : 0,
        estimatedTime: estimatedTime != null && estimatedTime !== '' ? Number(estimatedTime) : 0,
        assignedTo: assignedTo != null && assignedTo !== '' ? Number(assignedTo) : null,
        notes: notes || null,
        status: 'pending',
        branchId,
        createdById: userId || null,
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, address: true } },
        assignedTechnician: { select: { id: true, username: true, fullName: true, phone: true, role: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Service request created successfully',
      data: serviceRequest,
    });
  } catch (error) {
    console.error('Create service request error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create service request' });
  }
};

exports.updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      actualCost,
      actualTime,
      completedAt,
      technicianNotes,
    } = req.body;

    const userId = req.user?.id;

    const existing = await prisma.serviceRequest.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Service request not found' });
    }

    const updateData = {
      status: status || existing.status,
      updatedById: userId || null,
    };

    if ((status || existing.status) === 'completed') {
      updateData.actualCost = actualCost != null && actualCost !== '' ? Number(actualCost) : existing.estimatedCost;
      updateData.actualTime = actualTime != null && actualTime !== '' ? Number(actualTime) : existing.estimatedTime;
      updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
      updateData.technicianNotes = technicianNotes || null;
    }

    const updated = await prisma.serviceRequest.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        assignedTechnician: { select: { id: true, username: true, fullName: true, phone: true, role: true } },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Service request updated successfully',
      data: updated,
    });
  } catch (error) {
    console.error('Update service status error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update service request' });
  }
};

exports.getServiceRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      customerId,
      technicianId,
      startDate,
      endDate,
      priority,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const branchId = req.user?.branchId;

    const where = {};
    if (branchId) where.branchId = Number(branchId);
    if (status) where.status = status;
    if (customerId) where.customerId = Number(customerId);
    if (technicianId) where.assignedTo = Number(technicianId);
    if (priority) where.priority = priority;

    if (startDate && endDate) {
      where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          assignedTechnician: { select: { id: true, username: true, fullName: true, phone: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    const summary = await prisma.serviceRequest.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        requests,
        summary,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get service requests error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch service requests' });
  }
};

exports.getServiceHistory = async (req, res) => {
  try {
    const { customerId, machineId, serialNo, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const branchId = req.user?.branchId;

    const where = { status: 'completed' };
    if (branchId) where.branchId = Number(branchId);
    if (customerId) where.customerId = Number(customerId);
    if (machineId) where.machineId = String(machineId);
    if (serialNo) where.serialNo = String(serialNo);

    const [history, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          assignedTechnician: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        history,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get service history error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch service history' });
  }
};

exports.getTechnicians = async (req, res) => {
  try {
    const branchId = req.user?.branchId;
    const where = { isActive: true };
    if (branchId) where.branchId = Number(branchId);

    // Keep this permissive: any non-customer roles can be assigned. Customize later.
    const technicians = await prisma.user.findMany({
      where,
      select: { id: true, username: true, fullName: true, phone: true, email: true, role: true },
      orderBy: { fullName: 'asc' },
    });

    return res.status(200).json({ success: true, data: technicians });
  } catch (error) {
    console.error('Get technicians error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch technicians' });
  }
};

exports.getServiceAnalytics = async (req, res) => {
  // Optional endpoint — keep it light and correct. Expand later if needed.
  try {
    const { startDate, endDate } = req.query;
    const branchId = req.user?.branchId;

    const where = {};
    if (branchId) where.branchId = Number(branchId);
    if (startDate && endDate) where.createdAt = { gte: new Date(startDate), lte: new Date(endDate) };

    const [totalRequests, completedServices] = await Promise.all([
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.count({ where: { ...where, status: 'completed' } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalRequests,
        completedServices,
        completionRate: totalRequests > 0 ? Number(((completedServices / totalRequests) * 100).toFixed(1)) : 0,
        period: { startDate: startDate || null, endDate: endDate || null },
      },
    });
  } catch (error) {
    console.error('Get service analytics error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate service analytics' });
  }
};
