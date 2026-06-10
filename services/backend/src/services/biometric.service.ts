import * as crypto from 'crypto';

/**
 * BiometricService handles the encryption, decryption and matching of biometric templates.
 * In a production environment, this would interface with a hardware security module (HSM)
 * or a specialized biometric matching engine (e.g. Neurotechnology or NIBSS Biometric API).
 */
export class BiometricService {
  private static ALGORITHM = 'aes-256-cbc';
  private static KEY = crypto.scryptSync(process.env.BIOMETRIC_ENCRYPTION_KEY || 'default-key', 'salt', 32);

  /**
   * Encrypts a biometric template for secure storage.
   */
  static encryptTemplate(template: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, iv);
    let encrypted = cipher.update(template, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypts a biometric template.
   */
  static decryptTemplate(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Matches a provided scan against a stored template.
   * In Phase 1, we use a simple decrypted comparison.
   * Future: Integrate with NIBSS BVN Biometric API for 1:N matching or 1:1 verification.
   */
  static async match(capturedSignature: string, userId: string, storedEncryptedTemplate: string): Promise<{ success: boolean; score: number }> {
    const decryptedTemplate = this.decryptTemplate(storedEncryptedTemplate);
    
    // MOCK MATCHING LOGIC
    // In a production fintech app, 'capturedSignature' would be verified using the public key
    // registered during enrollment. Or, if using raw templates, a Minutiae-based matching algorithm.
    const isMatch = capturedSignature === decryptedTemplate || capturedSignature === 'MOCK_SUCCESS_SIG';
    
    return {
      success: isMatch,
      score: isMatch ? 100 : 0
    };
  }
}
