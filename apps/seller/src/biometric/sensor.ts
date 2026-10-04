import ReactNativeBiometrics from 'react-native-biometrics';
import { Alert } from 'react-native';

/**
 * Legacy device-local biometric helper.
 *
 * This authenticates biometrics enrolled on the merchant device and can
 * protect a cryptographic key. It does NOT identify a customer's fingerprint
 * across devices and must not be used as BPN's cross-device biometric
 * provider.
 */
export class BiometricSensor {
  private static rnBiometrics = new ReactNativeBiometrics();

  static async checkAvailability(): Promise<boolean> {
    const { available, error } = await this.rnBiometrics.isSensorAvailable();
    if (error) {
      console.error('Biometric error:', error);
      return false;
    }
    return available;
  }

  /**
   * Legacy compatibility method.
   *
   * The returned value is a device-level cryptographic signature, not a
   * fingerprint template. New checkout code must use BpnMerchantBiometricProvider.
   */
  static async captureFingerprint(
    promptMessage: string = 'Scan your fingerprint to pay',
    sessionToken: string = 'bpn-session-auth'
  ): Promise<string | null> {
    try {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        Alert.alert('Error', 'Biometric sensor not available or not enrolled.');
        return null;
      }

      const { success, signature, error } = await this.rnBiometrics.createSignature({
        promptMessage,
        payload: sessionToken
      });

      if (success && signature) return signature;

      if (error) console.error('Signature error:', error);
      return null;
    } catch (e) {
      console.error('Biometric exception:', e);
      return null;
    }
  }
}
