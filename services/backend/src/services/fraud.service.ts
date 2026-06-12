import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * FraudService handles transaction velocity checks and blacklist verification.
 */
export class FraudService {
  private static DAILY_LIMIT = 100000; // ₦100,000 daily limit for unverified users
  private static WATCHLIST = ['BVN12345678901', 'BVN99999999999']; // Mock NIBSS Watchlist

  /**
   * performChecks runs all fraud detection logic.
   */
  static async performChecks(userId: string, bvn: string, amount: number): Promise<{ safe: boolean; reason?: string }> {
    // 1. Blacklist/Watchlist check
    if (this.WATCHLIST.includes(bvn)) {
      return { safe: false, reason: 'BVN is on regulatory watchlist' };
    }

    // 2. Velocity Check (24h cumulative volume)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const transactions = await prisma.transaction.findMany({
      where: {
        buyerId: userId,
        createdAt: { gte: startOfDay },
        status: 'SUCCESS'
      }
    });

    const dailyVolume = transactions.reduce((acc: number, txn: any) => acc + Number(txn.amount), 0);
    
    if (dailyVolume + amount > this.DAILY_LIMIT) {
      return { safe: false, reason: 'Daily transaction limit exceeded (₦100,000)' };
    }

    return { safe: true };
  }
}
