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

  static async getChallenge(sessionToken: string, credentialId: string) {
    return await RedisService.get('bpn-auth:' + sessionToken + ':' + credentialId) as PaymentAuthorizationChallenge | null;
  }

  static async consumeChallenge(sessionToken: string, credentialId: string) {
    const challenge = await this.getChallenge(sessionToken, credentialId);
    if (challenge) await RedisService.del('bpn-auth:' + sessionToken + ':' + credentialId);
    return challenge;
  }
}
