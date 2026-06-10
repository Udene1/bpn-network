import { BiometricService } from '../src/services/biometric.service';

describe('BiometricService', () => {
  const mockTemplate = 'test-biometric-minutiae-123';

  it('should encrypt and decrypt a template correctly', () => {
    const encrypted = BiometricService.encryptTemplate(mockTemplate);
    expect(encrypted).toContain(':');
    
    const decrypted = BiometricService.decryptTemplate(encrypted);
    expect(decrypted).toBe(mockTemplate);
  });

  it('should match a valid signature', async () => {
    const encrypted = BiometricService.encryptTemplate(mockTemplate);
    const result = await BiometricService.match(mockTemplate, 'user-1', encrypted);
    expect(result.success).toBe(true);
    expect(result.score).toBe(100);
  });

  it('should not match an invalid signature', async () => {
    const encrypted = BiometricService.encryptTemplate(mockTemplate);
    const result = await BiometricService.match('wrong-sig', 'user-1', encrypted);
    expect(result.success).toBe(false);
  });
});
