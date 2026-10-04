import * as crypto from 'crypto';
import { BpnCredentialService } from '../src/services/bpn-credential.service';

describe('BpnCredentialService', () => {
  it('verifies a payment authorization signature without biometric data', () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const proof = {
      version: 'BPN-AUTH-1' as const,
      sessionToken: 'SESSION123',
      credentialId: 'cred_test',
      sellerId: 'merchant-1',
      amount: 25000,
      signature: ''
    };
    const payload = BpnCredentialService.buildAuthorizationPayload(proof);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(payload);
    signer.end();
    proof.signature = signer.sign(privateKey).toString('base64');

    expect(BpnCredentialService.verifyAuthorizationProof(publicKey.export({ type: 'spki', format: 'pem' }).toString(), proof)).toBe(true);
    expect(BpnCredentialService.verifyAuthorizationProof(publicKey.export({ type: 'spki', format: 'pem' }).toString(), { ...proof, amount: 25001 })).toBe(false);
  });
});
