/**
 * Merchant-side biometric provider boundary.
 *
 * A real SDK adapter will implement this interface once a provider is selected.
 * It must return a provider assertion/reference, not a device-level signature
 * masquerading as a fingerprint template.
 */
export type BpnBiometricModality = 'FINGERPRINT';

export interface BpnMerchantBiometricResult {
  provider: string;
  providerReference: string;
  modality: BpnBiometricModality;
  userId?: string;
  confidence?: number;
  livenessVerified?: boolean;
  assertion: string;
}

export interface BpnMerchantBiometricProvider {
  readonly name: string;
  enroll(): Promise<{ providerReference: string; biometricReference: string }>;
  identify(input: { challengeId: string; amount: number; currency: string }): Promise<BpnMerchantBiometricResult>;
}
