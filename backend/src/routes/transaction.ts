import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateUser, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = express.Router();
const prisma = new PrismaClient();

// Get user transactions with filtering
router.get('/', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const type = req.query.type as string;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: any = { userId };

  // Filter by transaction type
  if (type && ['DEPOSIT', 'WITHDRAWAL', 'PAYOUT', 'BONUS', 'FEE'].includes(type)) {
    where.type = type;
  }

  // Filter by date range
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    },
  });
}));

// Get transaction summary
router.get('/summary', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const period = req.query.period as string || '30d'; // 7d, 30d, 90d, 1y

  let startDate = new Date();
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }

  const summary = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      userId,
      createdAt: { gte: startDate },
    },
    _sum: { amount: true },
    _count: { id: true },
  });

  const formattedSummary = summary.reduce((acc, item) => {
    acc[item.type] = {
      total: item._sum.amount || 0,
      count: item._count.id,
    };
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  res.json({
    success: true,
    data: {
      period,
      summary: formattedSummary,
    },
  });
}));

// Get specific transaction details
router.get('/:id', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const transactionId = req.params.id;

  const transaction = await prisma.transaction.findFirst({
    where: {
      id: transactionId,
      userId,
    },
  });

  if (!transaction) {
    return res.status(404).json({
      success: false,
      error: 'Transaction not found',
    });
  }

  res.json({
    success: true,
    data: { transaction },
  });
}));

// Export transactions to CSV (for user)
router.get('/export/csv', authenticateUser, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const startDate = req.query.startDate as string;
  const endDate = req.query.endDate as string;

  const where: any = { userId };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  // Generate CSV content
  const csvHeader = 'Date,Type,Amount,Description,Reference,Status\n';
  const csvRows = transactions.map(tx => 
    `${tx.createdAt.toISOString()},${tx.type},${tx.amount},${tx.description},${tx.reference || ''},${tx.status}`
  ).join('\n');

  const csvContent = csvHeader + csvRows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
  res.send(csvContent);
}));

export default router;