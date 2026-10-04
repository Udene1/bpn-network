import jwt from 'jsonwebtoken';

/**
 * AuthService handles JWT generation and verification.
 */
export class AuthService {
  private static SECRET = process.env.JWT_SECRET;

  private static requireSecret(): string {
    if (!this.SECRET) throw new Error('JWT_SECRET is required');
    return this.SECRET;
  }

  static generateToken(payload: object): string {
    return jwt.sign(payload, this.requireSecret(), { expiresIn: '24h' });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.requireSecret());
    } catch (e) {
      return null;
    }
  }
}
