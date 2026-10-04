import { Platform } from 'react-native';

export type BpnSellerPlatform = 'ANDROID' | 'IOS';

export function getBpnSellerPlatform(): BpnSellerPlatform {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  throw new Error('BPN biometric acceptance requires an Android or iOS device.');
}
