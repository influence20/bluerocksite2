import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { formatCurrency } from '../utils/investment';

const prisma = new PrismaClient();

/**
 * Process weekly payouts every Friday at 12:00 PM UTC
 */
export const processWeeklyPayouts = async () => {
  try {
    logger.info('Starting weekly payout processing...');

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all scheduled payouts for today
    const scheduledPayouts = await prisma.payout.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        investmentPlan: {
          include: {
            user: true,
          },
        },
      },
    });

    logger.info(`Found ${scheduledPayouts.length} payouts to process`);

    for (const payout of scheduledPayouts) {
      try {
        // Update payout status to processing
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'PROCESSING',
            paidDate: new Date(),
          },
        });

        // Add to user balance
        await prisma.user.update({
          where: { id: payout.investmentPlan.userId },
          data: {
            balance: {
              increment: payout.amount,
            },
            totalEarnings: {
              increment: payout.amount,
            },
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId: payout.investmentPlan.userId,
            type: 'PAYOUT',
            amount: payout.amount,
            description: `Weekly payout - Week ${payout.weekNumber}`,
            reference: `PAYOUT-${payout.id}`,
            status: 'COMPLETED',
          },
        });

        // Update investment plan
        const updatedPlan = await prisma.investmentPlan.update({
          where: { id: payout.investmentPlanId },
          data: {
            completedPayouts: {
              increment: 1,
            },
            nextPayoutDate: payout.weekNumber < 8 ? 
              new Date(payout.scheduledDate.getTime() + 7 * 24 * 60 * 60 * 1000) : 
              null,
            status: payout.weekNumber >= 8 ? 'COMPLETED' : 'ACTIVE',
          },
        });

        // Mark payout as completed
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'COMPLETED',
          },
        });

        // Send email notification
        const nextPayoutDate = payout.weekNumber < 8 ? 
          new Date(payout.scheduledDate.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() :
          'Plan Completed';

        await sendEmail({
          to: payout.investmentPlan.user.email,
          template: 'weeklyPayout',
          data: {
            firstName: payout.investmentPlan.user.firstName,
            amount: formatCurrency(payout.amount).replace('$', ''),
            weekNumber: payout.weekNumber,
            payoutDate: payout.scheduledDate.toLocaleDateString(),
            nextPayoutDate,
            dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            logoUrl: `${process.env.FRONTEND_URL}/assets/brand/bluerock-logo.png`,
          },
        });

        logger.info(`Processed payout ${payout.id} for user ${payout.investmentPlan.user.email}`);

      } catch (error) {
        logger.error(`Failed to process payout ${payout.id}:`, error);
        
        // Mark payout as failed
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'FAILED',
          },
        });
      }
    }

    logger.info('Weekly payout processing completed');

  } catch (error) {
    logger.error('Error in weekly payout processing:', error);
  }
};

/**
 * Clean up expired withdrawal PINs every hour
 */
export const cleanupExpiredPins = async () => {
  try {
    const now = new Date();
    
    const expiredPins = await prisma.withdrawalPin.updateMany({
      where: {
        expiresAt: {
          lt: now,
        },
        isUsed: false,
      },
      data: {
        isUsed: true, // Mark as used to prevent reuse
      },
    });

    if (expiredPins.count > 0) {
      logger.info(`Cleaned up ${expiredPins.count} expired withdrawal PINs`);
    }

  } catch (error) {
    logger.error('Error cleaning up expired PINs:', error);
  }
};

/**
 * Send daily summary report to admins
 */
export const sendDailySummary = async () => {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get daily statistics
    const stats = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.deposit.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.withdrawal.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.payout.count({ where: { paidDate: { gte: today, lt: tomorrow } } }),
    ]);

    const [newUsers, newDeposits, newWithdrawals, processedPayouts] = stats;

    logger.info(`Daily Summary - New Users: ${newUsers}, Deposits: ${newDeposits}, Withdrawals: ${newWithdrawals}, Payouts: ${processedPayouts}`);

  } catch (error) {
    logger.error('Error generating daily summary:', error);
  }
};

/**
 * Start all cron jobs
 */
export const startCronJobs = () => {
  // Weekly payouts every Friday at 12:00 PM UTC
  cron.schedule('0 12 * * 5', processWeeklyPayouts, {
    timezone: 'UTC',
  });

  // Clean up expired PINs every hour
  cron.schedule('0 * * * *', cleanupExpiredPins, {
    timezone: 'UTC',
  });

  // Daily summary at 11:59 PM UTC
  cron.schedule('59 23 * * *', sendDailySummary, {
    timezone: 'UTC',
  });

  logger.info('Cron jobs scheduled successfully');
};