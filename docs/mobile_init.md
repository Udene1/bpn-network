# Mobile App Initialization (Phase 5)

To initialize the real React Native projects for the BPN ecosystem, run the following commands from the root directory.

## 1. Initialize Projects
```bash
# In apps/ folder
cd apps/
npx react-native init BuyerApp --directory buyer
npx react-native init SellerApp --directory seller
```

## 2. Install BPN Specific Native Modules
In each app directory, install the required biometric and encryption libraries:
```bash
npm install react-native-biometrics react-native-encrypted-storage
# For iOS (Mac required)
cd ios && pod install && cd ..
```

## 3. Link Existing Screens
Move the prototypes I've built into the newly initialized `src/` directories of these apps.

## 4. Android Configuration (Crucial)
In `android/app/src/main/AndroidManifest.xml`, ensure the following permission is added:
```xml
<uses-permission android:name="android.permission.USE_BIOMETRIC" />
```
In `android/app/build.gradle`, set `minSdkVersion = 23` (required for BiometricPrompt).
