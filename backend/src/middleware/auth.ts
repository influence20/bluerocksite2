import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { createError } from './errorHandler';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw createError('Invalid token or user deactivated.', 401);
    }

    req.user = {
      id: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token.', 401));
    } else {
      next(error);
    }
  }
};

export const authenticateAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw createError('Access denied. No token provided.', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify admin user exists and is active
    const adminUser = await prisma.adminUser.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true }
    });

    if (!adminUser || !adminUser.isActive) {
      throw createError('Invalid token or admin user deactivated.', 401);
    }

    req.user = {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(createError('Invalid token.', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions.', 403));
    }
    next();
  };
};