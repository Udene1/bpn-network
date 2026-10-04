import { BpnBiometricProvider } from './bpn-biometric-provider';

/**
 * Provider selection is configuration-driven so BPN is not coupled to one
 * biometric vendor. The mock/default path is intentionally not a production
 * implementation; it exists only as a wiring boundary until a real provider
 * is selected and integrated.
 */
export function getBpnBiometricProvider(): BpnBiometricProvider {
  const provider = (process.env.BPN_BIOMETRIC_PROVIDER || 'mock').toLowerCase();

  switch (provider) {
    case 'mock':
      throw new Error(
        'BPN biometric provider factory is not wired to a production implementation yet.'
      );
    default:
      throw new Error('Unsupported BPN_BIOMETRIC_PROVIDER: ' + provider);
  }
}
