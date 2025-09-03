import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { calculateInvestmentPlan, generateInvestmentExamples, getBlueRockWallets } from '../utils/investment';

const router = express.Router();
const prisma = new PrismaClient();

// Get investment calculator
router.get('/calculator', asyncHandler(async (req, res) => {
  const amount = parseFloat(req.query.amount as string);

  if (!amount || amount < 300) {
    return res.json({
      success: false,
      error: 'Minimum investment amount is $300',
    });
  }

  const calculation = calculateInvestmentPlan(amount);

  res.json({
    success: true,
    data: { calculation },
  });
}));

// Get investment examples
router.get('/examples', asyncHandler(async (req, res) => {
  const examples = generateInvestmentExamples();

  res.json({
    success: true,
    data: { examples },
  });
}));

// Get BlueRock wallet addresses
router.get('/wallets', asyncHandler(async (req, res) => {
  const wallets = getBlueRockWallets();

  res.json({
    success: true,
    data: { wallets },
  });
}));

// Get user's active investment plans
router.get('/plans', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const plans = await prisma.investmentPlan.findMany({
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
    data: { plans },
  });
}));

// Get specific investment plan details
router.get('/plans/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const planId = req.params.id;

  const plan = await prisma.investmentPlan.findFirst({
    where: {
      id: planId,
      userId,
    },
    include: {
      deposit: {
        select: {
          amount: true,
          cryptoType: true,
          transactionId: true,
          createdAt: true,
          confirmedAt: true,
        },
      },
      payouts: {
        orderBy: { weekNumber: 'asc' },
      },
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  if (!plan) {
    return res.status(404).json({
      success: false,
      error: 'Investment plan not found',
    });
  }

  res.json({
    success: true,
    data: { plan },
  });
}));

// Get investment statistics
router.get('/stats', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const [
    totalInvested,
    totalEarnings,
    activeInvestments,
    completedInvestments,
    nextPayout,
  ] = await Promise.all([
    prisma.investmentPlan.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.payout.aggregate({
      where: {
        investmentPlan: { userId },
        status: 'COMPLETED',
      },
      _sum: { amount: true },
    }),
    prisma.investmentPlan.count({
      where: { userId, status: 'ACTIVE' },
    }),
    prisma.investmentPlan.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.payout.findFirst({
      where: {
        investmentPlan: { userId },
        status: 'SCHEDULED',
      },
      orderBy: { scheduledDate: 'asc' },
      include: {
        investmentPlan: {
          select: { id: true },
        },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      totalInvested: totalInvested._sum.amount || 0,
      totalEarnings: totalEarnings._sum.amount || 0,
      activeInvestments,
      completedInvestments,
      nextPayout,
    },
  });
}));

export default router;