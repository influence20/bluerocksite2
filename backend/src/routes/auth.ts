import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { sendEmail } from '../utils/email';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// User Registration
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('phone').optional().isMobilePhone('any'),
  body('country').optional().trim().isLength({ min: 2, max: 100 }),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Validation failed', 400);
  }

  const { email, password, firstName, lastName, phone, country } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw createError('User already exists with this email', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      country,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
    },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  // Send welcome email
  await sendEmail({
    to: user.email,
    template: 'welcome',
    data: {
      firstName: user.firstName,
      email: user.email,
      dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      logoUrl: `${process.env.FRONTEND_URL}/assets/brand/bluerock-logo.png`,
    },
  });

  logger.info(`New user registered: ${user.email}`);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user,
      token,
    },
  });
}));

// User Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Invalid email or password', 400);
  }

  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    throw createError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw createError('Invalid email or password', 401);
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: user.balance,
        totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings,
      },
      token,
    },
  });
}));

// Admin Login
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw createError('Invalid email or password', 400);
  }

  const { email, password } = req.body;

  // Find admin user
  const adminUser = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (!adminUser || !adminUser.isActive) {
    throw createError('Invalid email or password', 401);
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, adminUser.password);
  if (!isValidPassword) {
    throw createError('Invalid email or password', 401);
  }

  // Update last login
  await prisma.adminUser.update({
    where: { id: adminUser.id },
    data: { lastLoginAt: new Date() },
  });

  // Generate JWT token
  const token = jwt.sign(
    { userId: adminUser.id, email: adminUser.email, role: adminUser.role },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  // Log admin login
  await prisma.auditLog.create({
    data: {
      adminUserId: adminUser.id,
      action: 'LOGIN',
      entity: 'AdminUser',
      entityId: adminUser.id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    },
  });

  logger.info(`Admin logged in: ${adminUser.email}`);

  res.json({
    success: true,
    message: 'Admin login successful',
    data: {
      user: {
        id: adminUser.id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
      },
      token,
    },
  });
}));

// Password Reset Request
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { userId: user.id, type: 'password_reset' },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );

  // Send password reset email
  await sendEmail({
    to: user.email,
    template: 'passwordReset',
    data: {
      firstName: user.firstName,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      logoUrl: `${process.env.FRONTEND_URL}/assets/brand/bluerock-logo.png`,
    },
  });

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  });
}));

// Password Reset
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
], asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== 'password_reset') {
      throw createError('Invalid reset token', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Password reset successful',
    });

  } catch (error) {
    throw createError('Invalid or expired reset token', 400);
  }
}));

export default router;