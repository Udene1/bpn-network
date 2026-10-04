import * as crypto from 'crypto';

export type BpnAuthorizationPayload = {
  version: 'BPN-AUTH-1';
  sessionToken: string;
  credentialId: string;
  sellerId: string;
  amount: number;
  accountId?: string;
};

export type BpnAuthorizationProof = BpnAuthorizationPayload & { signature: string };

export class BpnCredentialService {
  static buildAuthorizationPayload(input: Omit<BpnAuthorizationPayload, 'version'>): string {
    return JSON.stringify({ version: 'BPN-AUTH-1', sessionToken: input.sessionToken, credentialId: input.credentialId, sellerId: input.sellerId, amount: input.amount, ...(input.accountId ? { accountId: input.accountId } : {}) });
  }

  static verifyAuthorizationProof(publicKey: string, proof: BpnAuthorizationProof): boolean {
    const payload = this.buildAuthorizationPayload({ sessionToken: proof.sessionToken, credentialId: proof.credentialId, sellerId: proof.sellerId, amount: proof.amount });
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(payload, 'utf8');
      verifier.end();
      return verifier.verify(publicKey, Buffer.from(proof.signature, 'base64'));
    } catch { return false; }
  }

  static generateCredentialId(): string {
    return 'cred_' + crypto.randomBytes(18).toString('base64url');
  }
}
