import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
  const adminPassword = await bcrypt.hash('BlueRock2025!', 12);
  
  const adminUser = await prisma.adminUser.upsert({
    where: { email: 'admin@bluerockasset.com' },
    update: {},
    create: {
      email: 'admin@bluerockasset.com',
      password: adminPassword,
      firstName: 'BlueRock',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create system settings
  const systemSettings = [
    {
      key: 'SITE_NAME',
      value: 'BlueRock Asset Management',
      description: 'Website name',
    },
    {
      key: 'SUPPORT_EMAIL',
      value: 'bluerockasset@zohomail.com',
      description: 'Support email address',
    },
    {
      key: 'MINIMUM_INVESTMENT',
      value: '300',
      description: 'Minimum investment amount in USD',
    },
    {
      key: 'INVESTMENT_DURATION_WEEKS',
      value: '8',
      description: 'Investment plan duration in weeks',
    },
    {
      key: 'PAYOUT_DAY',
      value: '5',
      description: 'Day of week for payouts (1=Monday, 5=Friday)',
    },
    {
      key: 'WITHDRAWAL_PIN_EXPIRY_MINUTES',
      value: '30',
      description: 'Withdrawal PIN expiry time in minutes',
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }

  console.log('✅ Created system settings');

  // Create demo user for testing (optional)
  if (process.env.NODE_ENV === 'development') {
    const demoPassword = await bcrypt.hash('demo123456', 12);
    
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@bluerockasset.com' },
      update: {},
      create: {
        email: 'demo@bluerockasset.com',
        password: demoPassword,
        firstName: 'Demo',
        lastName: 'User',
        phone: '+1234567890',
        country: 'United States',
        balance: 1000.00,
        totalInvested: 5000.00,
        totalEarnings: 2400.00,
        isVerified: true,
      },
    });

    console.log('✅ Created demo user:', demoUser.email);

    // Create demo deposit and investment plan
    const demoDeposit = await prisma.deposit.create({
      data: {
        userId: demoUser.id,
        amount: 1000.00,
        cryptoType: 'USDT_ERC20',
        walletAddress: '0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3',
        transactionId: 'demo_tx_123456789',
        status: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: adminUser.id,
      },
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 14); // 2 weeks ago
    
    const nextPayoutDate = new Date();
    nextPayoutDate.setDate(nextPayoutDate.getDate() + 7); // Next Friday
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (7 * 8)); // 8 weeks from start

    const investmentPlan = await prisma.investmentPlan.create({
      data: {
        userId: demoUser.id,
        depositId: demoDeposit.id,
        amount: 1000.00,
        weeklyPayout: 600.00, // (1000 ÷ 500) × 300 = 600
        totalPayouts: 8,
        completedPayouts: 2,
        status: 'ACTIVE',
        startDate,
        endDate,
        nextPayoutDate,
      },
    });

    // Create some demo payouts
    const payouts = [
      {
        investmentPlanId: investmentPlan.id,
        amount: 600.00,
        weekNumber: 1,
        scheduledDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        paidDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED' as const,
      },
      {
        investmentPlanId: investmentPlan.id,
        amount: 600.00,
        weekNumber: 2,
        scheduledDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        paidDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'COMPLETED' as const,
      },
    ];

    await prisma.payout.createMany({ data: payouts });

    // Create remaining scheduled payouts
    for (let week = 3; week <= 8; week++) {
      await prisma.payout.create({
        data: {
          investmentPlanId: investmentPlan.id,
          amount: 600.00,
          weekNumber: week,
          scheduledDate: new Date(startDate.getTime() + week * 7 * 24 * 60 * 60 * 1000),
          status: 'SCHEDULED',
        },
      });
    }

    // Create demo transactions
    const transactions = [
      {
        userId: demoUser.id,
        type: 'DEPOSIT' as const,
        amount: 1000.00,
        description: 'Investment deposit confirmed - USDT_ERC20',
        reference: `DEP-${demoDeposit.id}`,
        status: 'COMPLETED' as const,
      },
      {
        userId: demoUser.id,
        type: 'PAYOUT' as const,
        amount: 600.00,
        description: 'Weekly payout - Week 1',
        reference: 'PAYOUT-week1',
        status: 'COMPLETED' as const,
      },
      {
        userId: demoUser.id,
        type: 'PAYOUT' as const,
        amount: 600.00,
        description: 'Weekly payout - Week 2',
        reference: 'PAYOUT-week2',
        status: 'COMPLETED' as const,
      },
    ];

    await prisma.transaction.createMany({ data: transactions });

    console.log('✅ Created demo investment plan and transactions');
  }

  console.log('🎉 Database seed completed successfully!');
  console.log('');
  console.log('📋 Admin Credentials:');
  console.log('   Email: admin@bluerockasset.com');
  console.log('   Password: BlueRock2025!');
  console.log('');
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Demo User Credentials:');
    console.log('   Email: demo@bluerockasset.com');
    console.log('   Password: demo123456');
    console.log('');
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });