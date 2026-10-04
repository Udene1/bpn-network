import { BpnBiometricProvider } from './bpn-biometric-provider';

/**
 * Production biometric provider selection.
 *
 * BPN deliberately has no mock/default biometric implementation. A missing or
 * unsupported provider is a hard configuration error so a deployment cannot
 * accidentally present simulated biometric matching as real security.
 */
export function getBpnBiometricProvider(): BpnBiometricProvider {
  const provider = process.env.BPN_BIOMETRIC_PROVIDER?.trim().toLowerCase();

  if (!provider) {
    throw new Error(
      'BPN_BIOMETRIC_PROVIDER is not configured. Biometric payments remain disabled until a real approved provider is installed.'
    );
  }

  throw new Error(
    'BPN biometric provider "' +
      provider +
      '" is not installed. Configure an approved production SDK adapter before enabling biometric payments.'
  );
}
