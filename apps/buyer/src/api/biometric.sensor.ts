import ReactNativeBiometrics from 'react-native-biometrics';
import { Alert } from 'react-native';

/**
 * BiometricSensor provides a wrapper for device-level fingerpint/face ID.
 */
export class BiometricSensor {
  private static rnBiometrics = new ReactNativeBiometrics();

  static async captureFingerprint(promptMessage: string): Promise<string | null> {
    const { available } = await this.rnBiometrics.isSensorAvailable();
    if (!available) {
      Alert.alert('Error', 'Biometric sensor not available.');
      return null;
    }

    const { success, signature } = await this.rnBiometrics.createSignature({
      promptMessage,
      payload: 'bpn-enroll-auth'
    });

    return success ? signature : null;
  }
}
