import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin, requireRole, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { calculateInvestmentPlan, generatePayoutSchedule, getNextFriday } from '../utils/investment';
import { sendEmail } from '../utils/email';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Admin Dashboard Stats
router.get('/dashboard', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    totalUsers,
    totalDeposits,
    totalWithdrawals,
    pendingDeposits,
    pendingWithdrawals,
    activeInvestments,
    todayStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.deposit.aggregate({ _sum: { amount: true }, where: { status: 'CONFIRMED' } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
    prisma.deposit.count({ where: { status: 'PENDING' } }),
    prisma.withdrawal.count({ where: { status: { in: ['PENDING', 'PIN_REQUIRED', 'APPROVED'] } } }),
    prisma.investmentPlan.count({ where: { status: 'ACTIVE' } }),
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.deposit.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.withdrawal.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.payout.count({ where: { paidDate: { gte: today, lt: tomorrow } } }),
    ]),
  ]);

  const [todayUsers, todayDeposits, todayWithdrawals, todayPayouts] = todayStats;

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalDepositsAmount: totalDeposits._sum.amount || 0,
        totalWithdrawalsAmount: totalWithdrawals._sum.amount || 0,
        pendingDeposits,
        pendingWithdrawals,
        activeInvestments,
      },
      today: {
        newUsers: todayUsers,
        newDeposits: todayDeposits,
        newWithdrawals: todayWithdrawals,
        processedPayouts: todayPayouts,
      },
    },
  });
}));

// Get all users
router.get('/users', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      balance: true,
      totalInvested: true,
      totalEarnings: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.user.count({ where });

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

// Get pending deposits
router.get('/deposits/pending', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const deposits = await prisma.deposit.findMany({
    where: { status: 'PENDING' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    success: true,
    data: { deposits },
  });
}));

// Confirm deposit and create investment plan
router.post('/deposits/:id/confirm', [
  authenticateAdmin,
  body('transactionId').optional().trim(),
], asyncHandler(async (req: AuthRequest, res) => {
  const depositId = req.params.id;
  const { transactionId } = req.body;
  const adminId = req.user!.id;

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId },
    include: { user: true },
  });

  if (!deposit) {
    throw createError('Deposit not found', 404);
  }

  if (deposit.status !== 'PENDING') {
    throw createError('Deposit already processed', 400);
  }

  // Calculate investment plan
  const investmentCalc = calculateInvestmentPlan(parseFloat(deposit.amount.toString()));
  const startDate = new Date();
  const nextPayoutDate = getNextFriday(startDate);
  const endDate = new Date(nextPayoutDate);
  endDate.setDate(endDate.getDate() + (7 * 7)); // 8 weeks total

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update deposit
    const updatedDeposit = await tx.deposit.update({
      where: { id: depositId },
      data: {
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: adminId,
        ...(transactionId && { transactionId }),
      },
    });

    // Update user balance and total invested
    await tx.user.update({
      where: { id: deposit.userId },
      data: {
        totalInvested: {
          increment: deposit.amount,
        },
      },
    });

    // Create investment plan
    const investmentPlan = await tx.investmentPlan.create({
      data: {
        userId: deposit.userId,
        depositId: deposit.id,
        amount: deposit.amount,
        weeklyPayout: investmentCalc.weeklyPayout,
        startDate,
        endDate,
        nextPayoutDate,
      },
    });

    // Generate payout schedule
    const payoutSchedule = generatePayoutSchedule(startDate, investmentCalc.weeklyPayout);
    
    await tx.payout.createMany({
      data: payoutSchedule.map((payout) => ({
        investmentPlanId: investmentPlan.id,
        amount: payout.amount,
        weekNumber: payout.weekNumber,
        scheduledDate: payout.scheduledDate,
      })),
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        userId: deposit.userId,
        type: 'DEPOSIT',
        amount: deposit.amount,
        description: `Investment deposit confirmed - ${deposit.cryptoType}`,
        reference: `DEP-${deposit.id}`,
        status: 'COMPLETED',
      },
    });

    return { updatedDeposit, investmentPlan };
  });

  // Send confirmation email
  await sendEmail({
    to: deposit.user.email,
    template: 'depositConfirmed',
    data: {
      firstName: deposit.user.firstName,
      amount: deposit.amount.toString(),
      weeklyPayout: investmentCalc.weeklyPayout.toString(),
      nextPayoutDate: nextPayoutDate.toLocaleDateString(),
      totalReturns: investmentCalc.totalReturns.toString(),
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      logoUrl: `${process.env.FRONTEND_URL}/assets/brand/bluerock-logo.png`,
    },
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      adminUserId: adminId,
      action: 'CONFIRM_DEPOSIT',
      entity: 'Deposit',
      entityId: depositId,
      newValues: { status: 'CONFIRMED', amount: deposit.amount },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  logger.info(`Deposit confirmed by admin ${req.user!.email}: ${depositId}`);

  res.json({
    success: true,
    message: 'Deposit confirmed and investment plan created',
    data: result,
  });
}));

// Reject deposit
router.post('/deposits/:id/reject', [
  authenticateAdmin,
  body('reason').trim().isLength({ min: 10, max: 500 }),
], asyncHandler(async (req: AuthRequest, res) => {
  const depositId = req.params.id;
  const { reason } = req.body;
  const adminId = req.user!.id;

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId },
    include: { user: true },
  });

  if (!deposit) {
    throw createError('Deposit not found', 404);
  }

  if (deposit.status !== 'PENDING') {
    throw createError('Deposit already processed', 400);
  }

  // Update deposit
  await prisma.deposit.update({
    where: { id: depositId },
    data: {
      status: 'REJECTED',
      notes: reason,
      confirmedBy: adminId,
    },
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      adminUserId: adminId,
      action: 'REJECT_DEPOSIT',
      entity: 'Deposit',
      entityId: depositId,
      newValues: { status: 'REJECTED', reason },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  logger.info(`Deposit rejected by admin ${req.user!.email}: ${depositId}`);

  res.json({
    success: true,
    message: 'Deposit rejected',
  });
}));

// Get pending withdrawals
router.get('/withdrawals/pending', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const withdrawals = await prisma.withdrawal.findMany({
    where: { 
      status: { in: ['PENDING', 'PIN_REQUIRED', 'APPROVED'] },
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          balance: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    success: true,
    data: { withdrawals },
  });
}));

// Generate withdrawal PIN
router.post('/withdrawals/:id/generate-pin', authenticateAdmin, asyncHandler(async (req: AuthRequest, res) => {
  const withdrawalId = req.params.id;
  const adminId = req.user!.id;

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal) {
    throw createError('Withdrawal not found', 404);
  }

  if (withdrawal.status !== 'PENDING') {
    throw createError('Withdrawal not in pending status', 400);
  }

  // Generate 6-digit PIN
  const pin = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30); // 30 minutes expiry

  // Create PIN record
  const withdrawalPin = await prisma.withdrawalPin.create({
    data: {
      userId: withdrawal.userId,
      pin,
      expiresAt,
    },
  });

  // Update withdrawal status
  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: { status: 'PIN_REQUIRED' },
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      adminUserId: adminId,
      action: 'GENERATE_WITHDRAWAL_PIN',
      entity: 'Withdrawal',
      entityId: withdrawalId,
      newValues: { pinId: withdrawalPin.id, expiresAt },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  logger.info(`Withdrawal PIN generated by admin ${req.user!.email} for withdrawal ${withdrawalId}`);

  res.json({
    success: true,
    message: 'PIN generated successfully',
    data: {
      pin,
      expiresAt,
      maskedPin: `${pin.substring(0, 2)}****`,
    },
  });
}));

// Approve withdrawal
router.post('/withdrawals/:id/approve', [
  authenticateAdmin,
  body('transactionId').trim().isLength({ min: 10, max: 200 }),
], asyncHandler(async (req: AuthRequest, res) => {
  const withdrawalId = req.params.id;
  const { transactionId } = req.body;
  const adminId = req.user!.id;

  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: withdrawalId },
    include: { user: true },
  });

  if (!withdrawal) {
    throw createError('Withdrawal not found', 404);
  }

  if (withdrawal.status !== 'APPROVED') {
    throw createError('Withdrawal not approved by user PIN', 400);
  }

  // Process withdrawal
  const result = await prisma.$transaction(async (tx) => {
    // Deduct from user balance
    await tx.user.update({
      where: { id: withdrawal.userId },
      data: {
        balance: {
          decrement: withdrawal.amount,
        },
      },
    });

    // Update withdrawal
    const updatedWithdrawal = await tx.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
        processedBy: adminId,
        transactionId,
      },
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        userId: withdrawal.userId,
        type: 'WITHDRAWAL',
        amount: withdrawal.amount,
        description: `Withdrawal processed - ${withdrawal.cryptoType}`,
        reference: `WD-${withdrawal.id}`,
        status: 'COMPLETED',
      },
    });

    return updatedWithdrawal;
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      adminUserId: adminId,
      action: 'APPROVE_WITHDRAWAL',
      entity: 'Withdrawal',
      entityId: withdrawalId,
      newValues: { status: 'COMPLETED', transactionId },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  logger.info(`Withdrawal approved by admin ${req.user!.email}: ${withdrawalId}`);

  res.json({
    success: true,
    message: 'Withdrawal processed successfully',
    data: result,
  });
}));

// Get audit logs
router.get('/audit-logs', authenticateAdmin, requireRole(['SUPER_ADMIN', 'ADMIN']), asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const action = req.query.action as string;
  const entity = req.query.entity as string;

  const where: any = {};
  if (action) where.action = action;
  if (entity) where.entity = entity;

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      adminUser: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.auditLog.count({ where });

  res.json({
    success: true,
    data: {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

// Create admin user (Super Admin only)
router.post('/users', [
  authenticateAdmin,
  requireRole(['SUPER_ADMIN']),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('role').isIn(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']),
], asyncHandler(async (req: AuthRequest, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    throw createError('Admin user already exists with this email', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const adminUser = await prisma.adminUser.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      createdAt: true,
    },
  });

  // Log admin action
  await prisma.auditLog.create({
    data: {
      adminUserId: req.user!.id,
      action: 'CREATE_ADMIN_USER',
      entity: 'AdminUser',
      entityId: adminUser.id,
      newValues: { email, role },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  res.status(201).json({
    success: true,
    message: 'Admin user created successfully',
    data: { adminUser },
  });
}));

export default router;