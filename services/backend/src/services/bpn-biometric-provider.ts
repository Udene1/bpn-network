/**
 * BPN Biometric Provider boundary.
 *
 * Vendor-neutral boundary for software/SDK biometric identification.
 * Android BiometricPrompt is not used as the cross-device recognition
 * mechanism because it authenticates credentials enrolled on the current
 * device rather than exposing a portable fingerprint representation.
 */

export type BpnBiometricModality = 'FINGERPRINT';

export interface BpnBiometricEnrollment {
  provider: string;
  providerReference: string;
  modality: BpnBiometricModality;
  /** Provider-controlled representation/reference. Never raw fingerprint data. */
  biometricReference: string;
}

export interface BpnBiometricIdentification {
  provider: string;
  providerReference: string;
  modality: BpnBiometricModality;
  userId: string;
  confidence?: number;
  livenessVerified?: boolean;
  /** Cryptographic/provider assertion that the backend can independently validate. */
  assertion: string;
}

export interface BpnBiometricChallenge {
  challengeId: string;
  merchantId: string;
  amount: number;
  currency: string;
  expiresAt: string;
  nonce: string;
}

export interface BpnBiometricProvider {
  readonly name: string;

  enroll(input: {
    userId: string;
    modality: BpnBiometricModality;
  }): Promise<BpnBiometricEnrollment>;

  identify(input: {
    challenge: BpnBiometricChallenge;
    modality: BpnBiometricModality;
  }): Promise<BpnBiometricIdentification>;

  verifyAssertion(input: {
    challenge: BpnBiometricChallenge;
    identification: BpnBiometricIdentification;
  }): Promise<boolean>;
}
