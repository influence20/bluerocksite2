import express from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { validateWalletAddress } from '../utils/investment';
import { sendEmail } from '../utils/email';
import { logger } from '../utils/logger';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Get user dashboard data
router.get('/dashboard', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      balance: true,
      totalInvested: true,
      totalEarnings: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Get active investment plans
  const activeInvestments = await prisma.investmentPlan.findMany({
    where: { 
      userId,
      status: 'ACTIVE',
    },
    include: {
      deposit: {
        select: {
          amount: true,
          cryptoType: true,
          createdAt: true,
        },
      },
      payouts: {
        where: { status: 'COMPLETED' },
        orderBy: { weekNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get recent transactions
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  // Get pending deposits
  const pendingDeposits = await prisma.deposit.findMany({
    where: { 
      userId,
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get pending withdrawals
  const pendingWithdrawals = await prisma.withdrawal.findMany({
    where: { 
      userId,
      status: { in: ['PENDING', 'PIN_REQUIRED', 'APPROVED', 'PROCESSING'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: {
      user,
      activeInvestments,
      recentTransactions,
      pendingDeposits,
      pendingWithdrawals,
      summary: {
        totalBalance: user.balance,
        totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings,
        activeInvestments: activeInvestments.length,
        pendingDeposits: pendingDeposits.length,
        pendingWithdrawals: pendingWithdrawals.length,
      },
    },
  });
}));

// Submit deposit
router.post('/deposit', [
  authenticateUser,
  body('amount').isFloat({ min: 300 }),
  body('cryptoType').isIn(['BTC', 'ETH', 'BNB', 'USDT_ERC20', 'USDT_BEP20', 'USDT_TRC20']),
  body('transactionId').optional().trim().isLength({ min: 10, max: 200 }),
  body('walletAddress').trim().isLength({ min: 20, max: 100 }),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const userId = req.user!.id;
  const { amount, cryptoType, transactionId, walletAddress } = req.body;

  // Validate wallet address format
  if (!validateWalletAddress(walletAddress, cryptoType)) {
    throw createError('Invalid wallet address format', 400);
  }

  // Create deposit record
  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amount,
      cryptoType,
      transactionId,
      walletAddress,
      status: 'PENDING',
    },
  });

  // Get user details for email
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, email: true },
  });

  // Send deposit received email
  await sendEmail({
    to: user!.email,
    template: 'depositReceived',
    data: {
      firstName: user!.firstName,
      amount: amount.toString(),
      cryptoType,
      transactionId: transactionId || 'Pending',
      logoUrl: `${process.env.FRONTEND_URL}/assets/brand/bluerock-logo.png`,
    },
  });

  logger.info(`Deposit submitted by user ${user!.email}: $${amount} ${cryptoType}`);

  res.status(201).json({
    success: true,
    message: 'Deposit submitted successfully. It will be confirmed within 24 hours.',
    data: { deposit },
  });
}));

// Request withdrawal
router.post('/withdrawal', [
  authenticateUser,
  body('amount').isFloat({ min: 10 }),
  body('cryptoType').isIn(['BTC', 'ETH', 'BNB', 'USDT_ERC20', 'USDT_BEP20', 'USDT_TRC20']),
  body('walletAddress').trim().isLength({ min: 20, max: 100 }),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const userId = req.user!.id;
  const { amount, cryptoType, walletAddress } = req.body;

  // Validate wallet address format
  if (!validateWalletAddress(walletAddress, cryptoType)) {
    throw createError('Invalid wallet address format', 400);
  }

  // Check user balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true, firstName: true, email: true },
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  if (parseFloat(user.balance.toString()) < amount) {
    throw createError('Insufficient balance', 400);
  }

  // Create withdrawal request
  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId,
      amount,
      cryptoType,
      walletAddress,
      status: 'PENDING',
    },
  });

  logger.info(`Withdrawal requested by user ${user.email}: $${amount} ${cryptoType}`);

  res.status(201).json({
    success: true,
    message: 'Withdrawal request submitted. You will receive a PIN via live chat to complete the process.',
    data: { withdrawal },
  });
}));

// Submit withdrawal PIN
router.post('/withdrawal/:id/pin', [
  authenticateUser,
  body('pin').trim().isLength({ min: 6, max: 6 }).isNumeric(),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Invalid PIN format', 400);
  }

  const userId = req.user!.id;
  const withdrawalId = req.params.id;
  const { pin } = req.body;

  // Find withdrawal
  const withdrawal = await prisma.withdrawal.findFirst({
    where: {
      id: withdrawalId,
      userId,
      status: 'PIN_REQUIRED',
    },
  });

  if (!withdrawal) {
    throw createError('Withdrawal not found or PIN not required', 404);
  }

  // Find valid PIN
  const withdrawalPin = await prisma.withdrawalPin.findFirst({
    where: {
      userId,
      pin,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!withdrawalPin) {
    throw createError('Invalid or expired PIN', 400);
  }

  // Mark PIN as used
  await prisma.withdrawalPin.update({
    where: { id: withdrawalPin.id },
    data: {
      isUsed: true,
      usedAt: new Date(),
    },
  });

  // Update withdrawal status
  await prisma.withdrawal.update({
    where: { id: withdrawalId },
    data: {
      status: 'APPROVED',
      pinId: withdrawalPin.id,
    },
  });

  logger.info(`Withdrawal PIN verified for user ${userId}, withdrawal ${withdrawalId}`);

  res.json({
    success: true,
    message: 'PIN verified successfully. Your withdrawal is now approved and will be processed shortly.',
  });
}));

// Get transaction history
router.get('/transactions', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const type = req.query.type as string;

  const where: any = { userId };
  if (type && ['DEPOSIT', 'WITHDRAWAL', 'PAYOUT', 'BONUS', 'FEE'].includes(type)) {
    where.type = type;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.transaction.count({ where });

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    },
  });
}));

// Get investment history
router.get('/investments', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const investments = await prisma.investmentPlan.findMany({
    where: { userId },
    include: {
      deposit: {
        select: {
          amount: true,
          cryptoType: true,
          createdAt: true,
          confirmedAt: true,
        },
      },
      payouts: {
        orderBy: { weekNumber: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    success: true,
    data: { investments },
  });
}));

// Update profile
router.put('/profile', [
  authenticateUser,
  body('firstName').optional().trim().isLength({ min: 2, max: 50 }),
  body('lastName').optional().trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone('any'),
  body('country').optional().trim().isLength({ min: 2, max: 100 }),
], asyncHandler(async (req: AuthRequest, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const userId = req.user!.id;
  const { firstName, lastName, phone, country } = req.body;

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(country && { country }),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      country: true,
    },
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser },
  });
}));

export default router;