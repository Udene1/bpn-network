import ReactNativeBiometrics from 'react-native-biometrics';
import { Alert } from 'react-native';

/**
 * BPN authenticator.
 *
 * The biometric never becomes a network payload. Android/iOS verifies the user
 * locally and unlocks a device-bound private key. BPN receives only the public
 * key at enrollment and a signature over a payment-specific challenge later.
 */
export class BiometricSensor {
  private static rnBiometrics = new ReactNativeBiometrics();

  static async createBpnCredential(): Promise<{ publicKey: string } | null> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      if (!available) {
        Alert.alert('Error', 'Biometric sensor not available.');
        return null;
      }

      const { publicKey } = await this.rnBiometrics.createKeys();
      return publicKey ? { publicKey } : null;
    } catch (e) {
      console.error('BPN credential creation failed:', e);
      return null;
    }
  }

  static async signPaymentChallenge(
    payload: string,
    promptMessage: string = 'Confirm this BPN payment'
  ): Promise<string | null> {
    try {
      const { available } = await this.rnBiometrics.isSensorAvailable();
      if (!available) {
        Alert.alert('Error', 'Biometric sensor not available or not enrolled.');
        return null;
      }

      const { success, signature, error } = await this.rnBiometrics.createSignature({
        promptMessage,
        payload
      });

      if (!success || !signature) {
        if (error) console.error('BPN authorization error:', error);
        return null;
      }

      return signature;
    } catch (e) {
      console.error('BPN authorization exception:', e);
      return null;
    }
  }

  /** @deprecated Use createBpnCredential/signPaymentChallenge. */
  static async captureFingerprint(promptMessage: string): Promise<string | null> {
    return this.signPaymentChallenge('legacy-bpn-enroll-auth', promptMessage);
  }
}
