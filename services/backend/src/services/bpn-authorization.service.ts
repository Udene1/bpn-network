import { RedisService } from './redis.service.js';
import { BpnCredentialService, BpnAuthorizationProof } from './bpn-credential.service.js';

export type PaymentAuthorizationChallenge = {
  sessionToken: string;
  credentialId: string;
  sellerId: string;
  amount: number;
  payload: string;
  expiresAt: string;
};

export class BpnAuthorizationService {
  static async createChallenge(sessionToken: string, credentialId: string, sellerId: string, amount: number) {
    const payload = BpnCredentialService.buildAuthorizationPayload({ sessionToken, credentialId, sellerId, amount });
    const challenge: PaymentAuthorizationChallenge = { sessionToken, credentialId, sellerId, amount, payload, expiresAt: new Date(Date.now() + 120000).toISOString() };
    await RedisService.set('bpn-auth:' + sessionToken + ':' + credentialId, challenge, 120);
    return challenge;
  }

  static async consumeChallenge(proof: BpnAuthorizationProof) {
    const key = 'bpn-auth:' + proof.sessionToken + ':' + proof.credentialId;
    const challenge = await RedisService.get(key) as PaymentAuthorizationChallenge | null;
    if (!challenge) return null;
    const expected = BpnCredentialService.buildAuthorizationPayload({ sessionToken: challenge.sessionToken, credentialId: challenge.credentialId, sellerId: challenge.sellerId, amount: challenge.amount });
    const supplied = BpnCredentialService.buildAuthorizationPayload({ sessionToken: proof.sessionToken, credentialId: proof.credentialId, sellerId: proof.sellerId, amount: proof.amount });
    if (expected !== supplied) return null;
    await RedisService.del(key);
    return challenge;
  }
}
