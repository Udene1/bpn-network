import ReactNativeBiometrics from 'react-native-biometrics';
import { Alert } from 'react-native';

/**
 * BiometricSensor provides a wrapper for device-level fingerpint/face ID.
 */
export class BiometricSensor {
  private static rnBiometrics = new ReactNativeBiometrics();

  /**
   * Checks if biometrics are available on the device.
   */
  static async checkAvailability(): Promise<boolean> {
    const { available, error } = await this.rnBiometrics.isSensorAvailable();
    if (error) {
      console.error('Biometric error:', error);
      return false;
    }
    return available;
  }

  /**
   * Captures a biometric signature/prompt.
   * In a real Android implementation, we might use this to sign a challenge 
   * string that the backend can verify.
   */
  static async captureFingerprint(promptMessage: string = 'Scan your fingerprint to pay'): Promise<string | null> {
    try {
      const isAvailable = await this.checkAvailability();
      if (!isAvailable) {
        Alert.alert('Error', 'Biometric sensor not available or not enrolled.');
        return null;
      }

      const { success, signature, error } = await this.rnBiometrics.createSignature({
        promptMessage,
        payload: 'bpn-session-auth' // Use session token here in production
      });

      if (success && signature) {
        return signature; // This serves as our "captured template" for the match
      }

      if (error) {
        console.error('Signature error:', error);
      }
      return null;
    } catch (e) {
      console.error('Biometric exception:', e);
      return null;
    }
  }
}
