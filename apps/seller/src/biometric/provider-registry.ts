import { BpnMerchantBiometricProvider } from './bpn-provider';
import { getBpnSellerPlatform } from './platform';

export type BpnSellerProviderName = 'unconfigured';

export function getSellerBiometricProvider(): BpnMerchantBiometricProvider {
  const platform = getBpnSellerPlatform();

  throw new Error(
    'BPN biometric SDK is not configured for ' +
      platform +
      '. Install an approved provider adapter before enabling biometric checkout.'
  );
}
