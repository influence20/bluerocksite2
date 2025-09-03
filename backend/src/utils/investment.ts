import { Decimal } from '@prisma/client/runtime/library';

export interface InvestmentCalculation {
  investment: number;
  weeklyPayout: number;
  totalPayouts: number;
  totalReturns: number;
  roi: number;
}

/**
 * Calculate investment plan details based on BlueRock's formula:
 * Weekly Payout = (Investment ÷ 500) × 300
 * Duration: 8 weeks
 * Minimum investment: $300
 */
export const calculateInvestmentPlan = (investmentAmount: number): InvestmentCalculation => {
  if (investmentAmount < 300) {
    throw new Error('Minimum investment amount is $300');
  }

  const weeklyPayout = (investmentAmount / 500) * 300;
  const totalPayouts = 8;
  const totalReturns = weeklyPayout * totalPayouts;
  const roi = ((totalReturns - investmentAmount) / investmentAmount) * 100;

  return {
    investment: investmentAmount,
    weeklyPayout: Math.round(weeklyPayout * 100) / 100, // Round to 2 decimal places
    totalPayouts,
    totalReturns: Math.round(totalReturns * 100) / 100,
    roi: Math.round(roi * 100) / 100,
  };
};

/**
 * Generate investment examples for different amounts
 */
export const generateInvestmentExamples = (): InvestmentCalculation[] => {
  const amounts = [300, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
  return amounts.map(amount => calculateInvestmentPlan(amount));
};

/**
 * Calculate next Friday date for payout scheduling
 */
export const getNextFriday = (fromDate: Date = new Date()): Date => {
  const date = new Date(fromDate);
  const dayOfWeek = date.getDay();
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
  
  // If today is Friday, get next Friday
  if (daysUntilFriday === 0) {
    date.setDate(date.getDate() + 7);
  } else {
    date.setDate(date.getDate() + daysUntilFriday);
  }
  
  // Set to 12:00 PM UTC for consistent timing
  date.setUTCHours(12, 0, 0, 0);
  
  return date;
};

/**
 * Generate payout schedule for an investment plan
 */
export const generatePayoutSchedule = (startDate: Date, weeklyAmount: number): Array<{
  weekNumber: number;
  amount: number;
  scheduledDate: Date;
}> => {
  const schedule = [];
  let currentDate = getNextFriday(startDate);

  for (let week = 1; week <= 8; week++) {
    schedule.push({
      weekNumber: week,
      amount: weeklyAmount,
      scheduledDate: new Date(currentDate),
    });

    // Move to next Friday
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return schedule;
};

/**
 * Validate cryptocurrency wallet address format
 */
export const validateWalletAddress = (address: string, cryptoType: string): boolean => {
  const patterns = {
    BTC: /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/,
    ETH: /^0x[a-fA-F0-9]{40}$/,
    BNB: /^0x[a-fA-F0-9]{40}$/,
    USDT_ERC20: /^0x[a-fA-F0-9]{40}$/,
    USDT_BEP20: /^0x[a-fA-F0-9]{40}$/,
    USDT_TRC20: /^T[A-Za-z1-9]{33}$/,
  };

  const pattern = patterns[cryptoType as keyof typeof patterns];
  return pattern ? pattern.test(address) : false;
};

/**
 * Get BlueRock wallet addresses for different cryptocurrencies
 */
export const getBlueRockWallets = () => {
  return {
    BTC: 'bc1q9jatk24hcxvcqwxa9t66tkqef7mj2gkqdvqzjd',
    ETH: '0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3',
    BNB: '0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3',
    USDT_ERC20: '0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3',
    USDT_BEP20: '0xB9Df7837E13B2BD16ddE11a03C0e48Df8fC78ba3',
    USDT_TRC20: 'TYEMJvWSj5E2d8zRnaoW9FdcRWYWbpfosG',
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number | Decimal, currency: string = 'USD'): string => {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(amount.toString());
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
};

/**
 * Generate unique transaction reference
 */
export const generateTransactionRef = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `BR${timestamp}${random}`.toUpperCase();
};