# Biometric Payment Network (BPN)

BPN is a non-custodial biometric payment system for Nigeria's informal economy.

## Setup

## Project Structure
- `apps/buyer`: React Native app for buyer enrollment.
- `apps/seller`: React Native app with Biometric POS.
- `services/backend`: Node.js/Fastify API with Anchor BaaS integration.
- `packages/shared`: Shared TS types.

## Setup & Running

### 1. Environment Variables
Copy `.env.example` to `.env` in `services/backend` and fill in the keys.

### 2. Backend
```bash
cd services/backend
npm install
npm run dev
```

### 3. Seller App
```bash
cd apps/seller
npm install
npx react-native run-android # Requires Android emulator/device
```

### 4. Tests
```bash
cd services/backend
npm test
```
