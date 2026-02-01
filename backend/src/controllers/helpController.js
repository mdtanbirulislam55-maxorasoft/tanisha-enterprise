const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

// ==================== FAQ MANAGEMENT ====================
exports.getFAQs = async (req, res) => {
  try {
    const { category, search = '', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
        { tags: { has: search } }
      ];
    }

    const [faqs, total] = await Promise.all([
      prisma.faq.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.faq.count({ where })
    ]);

    // Get categories for filtering
    const categories = await prisma.faq.groupBy({
      by: ['category'],
      where: { isActive: true },
      _count: {
        id: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        faqs,
        categories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch FAQs'
    });
  }
};

exports.createFAQ = async (req, res) => {
  try {
    const {
      question,
      answer,
      category,
      tags,
      order = 0
    } = req.body;

    const userId = req.user?.id;

    if (!question || !answer || !category) {
      return res.status(400).json({
        success: false,
        error: 'Question, answer and category are required'
      });
    }

    const faq = await prisma.faq.create({
      data: {
        question,
        answer,
        category,
        tags: tags || [],
        order,
        isActive: true,
        createdById: userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data: faq
    });

  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create FAQ'
    });
  }
};

// ==================== USER GUIDES ====================
exports.getUserGuides = async (req, res) => {
  try {
    const { module, search = '', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = { isPublished: true };

    if (module) {
      where.module = module;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [guides, total] = await Promise.all([
      prisma.userGuide.findMany({
        where,
        orderBy: [
          { module: 'asc' },
          { order: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      }),
      prisma.userGuide.count({ where })
    ]);

    // Get modules for filtering
    const modules = await prisma.userGuide.groupBy({
      by: ['module'],
      where: { isPublished: true },
      _count: {
        id: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        guides,
        modules,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get user guides error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user guides'
    });
  }
};

// ==================== SUPPORT TICKETS ====================
exports.createSupportTicket = async (req, res) => {
  try {
    const {
      subject,
      description,
      priority,
      category,
      attachments
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: 'Subject and description are required'
      });
    }

    // Generate ticket number
    const ticketNo = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNo,
        subject,
        description,
        priority: priority || 'medium',
        category: category || 'general',
        status: 'open',
        branchId,
        userId,
        attachments: attachments || []
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Send notification email (if configured)
    if (process.env.SUPPORT_EMAIL) {
      await sendSupportNotification(ticket);
    }

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create support ticket'
    });
  }
};

exports.getSupportTickets = async (req, res) => {
  try {
    const {
      status,
      priority,
      category,
      userId,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const branchId = req.user?.branchId;
    const currentUserId = req.user?.id;

    const where = {};

    // Regular users can only see their own tickets
    // Admins can see all tickets
    if (req.user?.role !== 'admin') {
      where.userId = currentUserId;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (category) {
      where.category = category;
    }

    if (userId && req.user?.role === 'admin') {
      where.userId = parseInt(userId);
    }

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              replies: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.supportTicket.count({ where })
    ]);

    // Get ticket statistics
    const stats = await prisma.supportTicket.groupBy({
      by: ['status'],
      where: { branchId },
      _count: {
        id: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        tickets,
        statistics: stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch support tickets'
    });
  }
};

exports.updateSupportTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, priority, notes } = req.body;
    const userId = req.user?.id;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    const updateData = {
      updatedAt: new Date()
    };

    if (status) {
      updateData.status = status;
      if (status === 'closed') {
        updateData.closedAt = new Date();
        updateData.closedById = userId;
      }
    }

    if (assignedTo) {
      updateData.assignedTo = parseInt(assignedTo);
    }

    if (priority) {
      updateData.priority = priority;
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: true,
        assignedTo: true
      }
    });

    // Add note if provided
    if (notes) {
      await prisma.ticketReply.create({
        data: {
          ticketId: parseInt(id),
          userId,
          message: notes,
          isInternalNote: true
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: updatedTicket
    });

  } catch (error) {
    console.error('Update support ticket error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update support ticket'
    });
  }
};

exports.addTicketReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachments } = req.body;
    const userId = req.user?.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parseInt(id) }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Check if user has permission to reply
    if (ticket.userId !== userId && req.user?.role !== 'admin' && ticket.assignedTo !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to reply to this ticket'
      });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        ticketId: parseInt(id),
        userId,
        message,
        attachments: attachments || [],
        isInternalNote: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Update ticket status and last activity
    await prisma.supportTicket.update({
      where: { id: parseInt(id) },
      data: {
        status: req.user?.role === 'admin' ? 'replied' : 'customer_replied',
        lastActivityAt: new Date()
      }
    });

    // Send email notification to other party
    await sendTicketReplyNotification(ticket, reply, req.user);

    res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: reply
    });

  } catch (error) {
    console.error('Add ticket reply error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add reply'
    });
  }
};

exports.getTicketReplies = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: true
      }
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: 'Support ticket not found'
      });
    }

    // Check if user has permission to view replies
    if (ticket.userId !== userId && req.user?.role !== 'admin' && ticket.assignedTo !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this ticket'
      });
    }

    const replies = await prisma.ticketReply.findMany({
      where: {
        ticketId: parseInt(id),
        OR: [
          { isInternalNote: false },
          { 
            isInternalNote: true,
            OR: [
              { userId }, // User can see their own internal notes
              { userId: req.user?.role === 'admin' ? { not: null } : 0 } // Admins can see all internal notes
            ]
          }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        ticket,
        replies
      }
    });

  } catch (error) {
    console.error('Get ticket replies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ticket replies'
    });
  }
};

// ==================== CONTACT SUPPORT ====================
exports.contactSupport = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
      category
    } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, subject and message are required'
      });
    }

    // Create contact message
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        phone,
        subject,
        message,
        category: category || 'general',
        status: 'new',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }
    });

    // Send email to support team
    await sendContactEmail(contactMessage);

    // Send auto-reply to user
    await sendAutoReplyEmail(contactMessage);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully. We will contact you soon.',
      data: {
        id: contactMessage.id,
        reference: `CONTACT-${contactMessage.id}`
      }
    });

  } catch (error) {
    console.error('Contact support error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
  }
};

// ==================== SYSTEM STATUS ====================
exports.getSystemStatus = async (req, res) => {
  try {
    const currentTime = new Date();

    // Check database connection
    const dbStatus = await checkDatabaseStatus();

    // Check external services
    const emailService = await checkEmailService();
    const storageService = await checkStorageService();

    // Get recent system alerts
    const recentAlerts = await prisma.systemAlert.findMany({
      where: {
        createdAt: {
          gte: new Date(currentTime.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get system metrics
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        connections: await getDatabaseConnections(),
        size: await getDatabaseSize()
      },
      api: {
        requestsLastHour: await getApiRequestCount(currentTime, 60),
        averageResponseTime: await getAverageResponseTime()
      }
    };

    const status = {
      overall: determineOverallStatus(dbStatus, emailService, storageService),
      services: {
        database: dbStatus,
        email: emailService,
        storage: storageService,
        api: { status: 'healthy', latency: metrics.api.averageResponseTime }
      },
      metrics,
      alerts: recentAlerts,
      lastUpdated: currentTime
    };

    res.status(200).json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('Get system status error:', error);
    res.status(500).json({
      success: false,
      data: {
        overall: 'unavailable',
        error: error.message,
        lastUpdated: new Date()
      }
    });
  }
};

// ==================== FEEDBACK & RATINGS ====================
exports.submitFeedback = async (req, res) => {
  try {
    const {
      rating,
      comments,
      category,
      module,
      suggestions
    } = req.body;

    const userId = req.user?.id;
    const branchId = req.user?.branchId;

    if (!rating || !comments) {
      return res.status(400).json({
        success: false,
        error: 'Rating and comments are required'
      });
    }

    const feedback = await prisma.feedback.create({
      data: {
        userId,
        branchId,
        rating: parseInt(rating),
        comments,
        category: category || 'general',
        module: module || 'system',
        suggestions: suggestions || '',
        status: 'new',
        ipAddress: req.ip
      }
    });

    // Calculate average rating for the module
    const moduleStats = await prisma.feedback.aggregate({
      where: {
        module: module || 'system',
        branchId
      },
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      data: {
        feedback,
        statistics: {
          averageRating: moduleStats._avg.rating || 0,
          totalFeedbacks: moduleStats._count.id || 0
        }
      }
    });

  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
};

exports.getFeedback = async (req, res) => {
  try {
    const {
      module,
      category,
      startDate,
      endDate,
      minRating,
      page = 1,
      limit = 20
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const branchId = req.user?.branchId;

    const where = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (module) {
      where.module = module;
    }

    if (category) {
      where.category = category;
    }

    if (minRating) {
      where.rating = { gte: parseInt(minRating) };
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: parseInt(limit)
      }),
      prisma.feedback.count({ where })
    ]);

    // Get statistics
    const stats = await prisma.feedback.aggregate({
      where,
      _avg: {
        rating: true
      },
      _count: {
        id: true
      }
    });

    // Get rating distribution
    const ratingDistribution = await prisma.feedback.groupBy({
      by: ['rating'],
      where,
      _count: {
        id: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        statistics: {
          averageRating: stats._avg.rating || 0,
          totalFeedbacks: stats._count.id || 0,
          ratingDistribution
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
};

// ==================== HELPER FUNCTIONS ====================
async function sendSupportNotification(ticket) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: process.env.SUPPORT_EMAIL,
      subject: `New Support Ticket: ${ticket.ticketNo}`,
      html: `
        <h3>New Support Ticket Created</h3>
        <p><strong>Ticket Number:</strong> ${ticket.ticketNo}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>Priority:</strong> ${ticket.priority}</p>
        <p><strong>Category:</strong> ${ticket.category}</p>
        <p><strong>Description:</strong></p>
        <p>${ticket.description}</p>
        <hr>
        <p><strong>User:</strong> ${ticket.user.name} (${ticket.user.email})</p>
        <p><strong>Branch:</strong> ${ticket.branch.name}</p>
        <p><strong>Submitted:</strong> ${ticket.createdAt.toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send support notification error:', error);
  }
}

async function sendTicketReplyNotification(ticket, reply, currentUser) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Determine recipient
    let recipientEmail;
    if (currentUser.role === 'admin') {
      // Admin replied, notify customer
      recipientEmail = ticket.user.email;
    } else {
      // Customer replied, notify assigned admin or support team
      if (ticket.assignedTo) {
        const assignedUser = await prisma.user.findUnique({
          where: { id: ticket.assignedTo },
          select: { email: true }
        });
        recipientEmail = assignedUser?.email || process.env.SUPPORT_EMAIL;
      } else {
        recipientEmail = process.env.SUPPORT_EMAIL;
      }
    }

    if (!recipientEmail) return;

    const mailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: recipientEmail,
      subject: `Update on Support Ticket: ${ticket.ticketNo}`,
      html: `
        <h3>New Reply on Support Ticket</h3>
        <p><strong>Ticket Number:</strong> ${ticket.ticketNo}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p><strong>From:</strong> ${currentUser.name} (${currentUser.role})</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${reply.message}
        </div>
        <hr>
        <p>You can view and reply to this ticket in the support system.</p>
        <p><a href="${process.env.APP_URL}/support/tickets/${ticket.id}">View Ticket</a></p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send ticket reply notification error:', error);
  }
}

async function sendContactEmail(contactMessage) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.CONTACT_EMAIL,
      to: process.env.SUPPORT_EMAIL,
      subject: `New Contact Message: ${contactMessage.subject}`,
      html: `
        <h3>New Contact Message Received</h3>
        <p><strong>Reference:</strong> CONTACT-${contactMessage.id}</p>
        <p><strong>Subject:</strong> ${contactMessage.subject}</p>
        <p><strong>Category:</strong> ${contactMessage.category}</p>
        <p><strong>Message:</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
          ${contactMessage.message}
        </div>
        <hr>
        <p><strong>Contact Information:</strong></p>
        <p>Name: ${contactMessage.name}</p>
        <p>Email: ${contactMessage.email}</p>
        <p>Phone: ${contactMessage.phone || 'Not provided'}</p>
        <p>IP Address: ${contactMessage.ipAddress}</p>
        <p>Submitted: ${contactMessage.createdAt.toLocaleString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send contact email error:', error);
  }
}

async function sendAutoReplyEmail(contactMessage) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SUPPORT_EMAIL,
      to: contactMessage.email,
      subject: 'We have received your message',
      html: `
        <h3>Thank you for contacting Tanisha Enterprise Support</h3>
        <p>Dear ${contactMessage.name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        <p><strong>Your Reference:</strong> CONTACT-${contactMessage.id}</p>
        <p><strong>Subject:</strong> ${contactMessage.subject}</p>
        <p><strong>Submitted:</strong> ${contactMessage.createdAt.toLocaleString()}</p>
        <hr>
        <p>For urgent matters, you can call our support hotline: ${process.env.SUPPORT_PHONE || '+880 XXXXXXX'}</p>
        <p>Best regards,<br>Tanisha Enterprise Support Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Send auto-reply email error:', error);
  }
}

async function checkDatabaseStatus() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      latency: await measureQueryLatency()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkEmailService() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true'
    });

    const start = Date.now();
    await transporter.verify();
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

async function checkStorageService() {
  // Implement storage service check
  return {
    status: 'healthy',
    latency: 0
  };
}

async function measureQueryLatency() {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return Date.now() - start;
}

async function getDatabaseConnections() {
  try {
    const result = await prisma.$queryRaw`
      SELECT count(*) as connections 
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    return result[0]?.connections || 0;
  } catch (error) {
    return null;
  }
}

async function getDatabaseSize() {
  try {
    const result = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `;
    return result[0]?.size || 'Unknown';
  } catch (error) {
    return 'Unknown';
  }
}

async function getApiRequestCount(sinceTime, minutes) {
  // Implement API request counting logic
  // This could use Redis or a database table to track requests
  return 0;
}

async function getAverageResponseTime() {
  // Implement average response time calculation
  // This would require tracking response times
  return 0;
}

function determineOverallStatus(...services) {
  const unhealthyCount = services.filter(s => s.status !== 'healthy').length;
  
  if (unhealthyCount === 0) return 'healthy';
  if (unhealthyCount === services.length) return 'critical';
  return 'degraded';
}