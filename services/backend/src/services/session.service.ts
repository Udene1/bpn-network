import * as crypto from 'crypto';

/**
 * SessionService manages short-lived payment sessions and invoices.
 */
export class SessionService {
  /**
   * Generates a 6-digit session code or a unique token for the POS session.
   */
  static generateSessionToken(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Creates a session with metadata (amount, sellerId).
   * Expires in 120 seconds.
   */
  static async createSession(sellerId: string, amount: number) {
    const token = this.generateSessionToken();
    const expiresAt = new Date(Date.now() + 120 * 1000); // 120s expiry
    
    // In reality, this would be stored in Redis
    return {
      token,
      sellerId,
      amount,
      expiresAt
    };
  }
}
