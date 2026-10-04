const Constants = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.verimut.icu',
  BIOMETRIC_ENGINE_URL: process.env.EXPO_PUBLIC_BPN_BIOMETRIC_ENGINE_URL || '',
  APP_NAME: 'BPN Seller POS',
  SESSION_TIMEOUT_SEC: 120,
};
export default Constants;