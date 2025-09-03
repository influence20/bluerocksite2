import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/email';
import { generateInvestmentExamples, getBlueRockWallets } from '../utils/investment';

const router = express.Router();
const prisma = new PrismaClient();

// Contact form submission
router.post('/contact', [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 5, max: 200 }),
  body('message').trim().isLength({ min: 10, max: 2000 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { name, email, subject, message } = req.body;

  // Send email to BlueRock support
  await sendEmail({
    to: process.env.ZOHO_EMAIL!,
    template: 'contactForm',
    data: {
      name,
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
    },
  });

  // Send confirmation email to user
  await sendEmail({
    to: email,
    template: 'contactConfirmation',
    data: {
      name,
      subject,
      logoUrl: `${process.env.FRONTEND_URL}/assets/brand/bluerock-logo.png`,
    },
  });

  res.json({
    success: true,
    message: 'Thank you for your message. We will get back to you within 24 hours.',
  });
}));

// Get investment examples for public display
router.get('/investment-examples', asyncHandler(async (req, res) => {
  const examples = generateInvestmentExamples();

  res.json({
    success: true,
    data: { examples },
  });
}));

// Get crypto wallet addresses for deposits
router.get('/wallets', asyncHandler(async (req, res) => {
  const wallets = getBlueRockWallets();

  res.json({
    success: true,
    data: { wallets },
  });
}));

// Newsletter subscription
router.post('/newsletter', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Store newsletter subscription (you might want to use a separate table)
  // For now, we'll just send a confirmation email

  await sendEmail({
    to: email,
    template: 'newsletterSubscription',
    data: {
      email,
      logoUrl: `${process.env.FRONTEND_URL}/assets/brand/bluerock-logo.png`,
    },
  });

  res.json({
    success: true,
    message: 'Successfully subscribed to our newsletter.',
  });
}));

// Get public statistics (anonymized)
router.get('/stats', asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalInvestments,
    totalPayouts,
    activeInvestments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.investmentPlan.count(),
    prisma.payout.count({ where: { status: 'COMPLETED' } }),
    prisma.investmentPlan.count({ where: { status: 'ACTIVE' } }),
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalInvestments,
      totalPayouts,
      activeInvestments,
    },
  });
}));

// Health check for public API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'BlueRock Asset Management API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;