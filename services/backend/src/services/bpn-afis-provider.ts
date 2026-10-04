import axios from 'axios';
import crypto from 'crypto';
import {
  BpnBiometricChallenge,
  BpnBiometricEnrollment,
  BpnBiometricIdentification,
  BpnBiometricModality,
  BpnBiometricProvider,
} from './bpn-biometric-provider';

const ENGINE_URL = process.env.BPN_BIOMETRIC_ENGINE_URL?.replace(/\/$/, '');
const SECRET = process.env.BPN_BIOMETRIC_ASSERTION_SECRET;

function requireConfig() {
  if (!ENGINE_URL) throw new Error('BPN_BIOMETRIC_ENGINE_URL is not configured.');
  if (!SECRET) throw new Error('BPN_BIOMETRIC_ASSERTION_SECRET is not configured.');
}

function signAssertion(payload: string) {
  return crypto.createHmac('sha256', SECRET as string).update(payload).digest('base64url');
}

export class BpnAfisProvider implements BpnBiometricProvider {
  readonly name = 'bpn-afis-experimental';

  async enroll(input: {
    userId: string;
    modality: BpnBiometricModality;
    capture?: { imageBase64: string; imageMime?: string };
  }): Promise<BpnBiometricEnrollment> {
    requireConfig();
    if (!input.capture) throw new Error('BPN AFIS enrollment requires a real fingerprint image capture.');
    const response = await axios.post(`${ENGINE_URL}/v1/enroll`, {
      user_id: input.userId,
      image_base64: input.capture.imageBase64,
      image_mime: input.capture.imageMime ?? 'image/jpeg',
    });
    return {
      provider: this.name,
      providerReference: response.data.providerReference,
      modality: input.modality,
      biometricReference: response.data.providerReference,
    };
  }

  async identify(input: {
    challenge: BpnBiometricChallenge;
    modality: BpnBiometricModality;
    capture?: { imageBase64: string; imageMime?: string };
  }): Promise<BpnBiometricIdentification> {
    requireConfig();
    if (!input.capture) throw new Error('BPN AFIS identification requires a real fingerprint image capture.');
    const response = await axios.post(`${ENGINE_URL}/v1/identify`, {
      image_base64: input.capture.imageBase64,
      image_mime: input.capture.imageMime ?? 'image/jpeg',
      threshold: Number(process.env.BPN_BIOMETRIC_MATCH_THRESHOLD ?? 40),
    });
    if (!response.data.matched || !response.data.userId) {
      throw new Error('BPN AFIS could not identify the fingerprint above the configured threshold.');
    }
    const timestamp = Date.now().toString();
    const assertionPayload = [
      input.challenge.challengeId, input.challenge.merchantId, input.challenge.amount,
      input.challenge.currency, response.data.userId, response.data.confidence ?? 0, timestamp,
    ].join('|');
    return {
      provider: this.name,
      providerReference: `bpn-afis:${response.data.userId}`,
      modality: input.modality,
      userId: response.data.userId,
      confidence: response.data.confidence,
      livenessVerified: false,
      assertion: `${timestamp}.${signAssertion(assertionPayload)}`,
    };
  }

  async verifyAssertion(input: {
    challenge: BpnBiometricChallenge;
    identification: BpnBiometricIdentification;
  }): Promise<boolean> {
    requireConfig();
    const [timestamp, signature] = input.identification.assertion.split('.');
    if (!timestamp || !signature) return false;
    const age = Date.now() - Number(timestamp);
    if (!Number.isFinite(age) || age < -30000 || age > 120000) return false;
    const payload = [
      input.challenge.challengeId, input.challenge.merchantId, input.challenge.amount,
      input.challenge.currency, input.identification.userId, input.identification.confidence ?? 0, timestamp,
    ].join('|');
    const expected = signAssertion(payload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}
