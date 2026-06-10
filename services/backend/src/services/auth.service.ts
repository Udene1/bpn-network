import jwt from 'jsonwebtoken';

/**
 * AuthService handles JWT generation and verification.
 */
export class AuthService {
  private static SECRET = process.env.JWT_SECRET || 'super-secret-key';

  static generateToken(payload: object): string {
    return jwt.sign(payload, this.SECRET, { expiresIn: '24h' });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.SECRET);
    } catch (e) {
      return null;
    }
  }
}
