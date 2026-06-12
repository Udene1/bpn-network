# Biometric Payment Network (BPN)

BPN is a secure, NDPR-compliant, non-custodial biometric payment micro-network for Nigeria's informal economy. 
It enables buyers to confirm transactions securely using fingerprint verification at merchant POS terminals without requiring cards, internet-connected smartphones, or NFC devices.

## Architecture

1. **Buyer App (React Native)**
   - Used for one-time enrollment: Captures BVN, biometric template (encrypted locally and stored on the backend), and links a primary funding bank account.
2. **Seller App (React Native)**
   - Acts as the POS terminal. The merchant generates an invoice (`/invoice`), and the user places their finger on the merchant's device sensor to authorize the payment via (`/match-and-pay`).
3. **Backend Service (Node.js/Fastify)**
   - Fast, scalable API interface.
   - **Prisma/PostgreSQL**: Manages core relationships (Users, Accounts, AuditLogs for NDPR).
   - **Redis**: Caches POS sessions with short TTLs and provides strict IP-based rate limiting.
   - **Anchor BaaS**: Executes NIBSS Instant Payments (NIP) programmatically in the background after biometric validation.

## Setup & Running

### 1. Environment Configuration
Navigate to `services/backend`, copy `.env.example` to `.env`, and populate the actual keys for JWT, ANCHOR, and DB connections. Ensure Redis and PostgreSQL are running locally or via Docker.

### 2. Backend API
```bash
cd services/backend
npm install
npx prisma generate
npm run dev
```

### 3. Seller POS Application
It is recommended to run this on a physical Android device to access the actual Biometric sensor securely.
```bash
cd apps/seller
npm install
npx react-native run-android
```

### 4. Tests
The backend includes Jest automated testing for the biometric encryption functions and a Node testing script to simulate a full interaction flow.
```bash
cd services/backend
# Unit tests
npm test
# Integration Flow
node tests/full-flow.js
```
