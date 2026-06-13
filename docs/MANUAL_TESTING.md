# BPN Manual Testing Guide

This guide ensures a consistent verification process for the Biometric Payment Network using real Android devices and the Anchor Sandbox.

## Prerequisites
1. **Android Device**: Physical device required for biometric sensor access.
2. **Anchor Sandbox Key**: Ensure `ANCHOR_API_KEY` is set in `.env`.
3. **Local Network**: Your phone and laptop must be on the same Wi-Fi.

## Test Scenario 1: The Happy Path (Enrollment to Payment)
1. **Launch Buyer App**:
   - Open Enrollment Screen.
   - Enter mock BVN (11 digits).
   - Select a Bank and enter a 10-digit account number.
   - **Consent**: Toggle the NDPR consent switch.
   - **Enroll**: Scan your fingerprint. Verify the "Enrollment Complete" alert.
2. **Launch Seller App**:
   - Enter Amount: `5000`.
   - Tap "Collect Biometric Payment".
   - **Scan**: Ask the buyer (you) to tap the sensor on the seller phone.
   - **Verification**: Observe the loading status change to "Verifying...".
   - **Result**: Verify the Digital Receipt displays the correct amount and buyer name.

## Test Scenario 2: Security & Expiry
1. **Session Timeout**:
   - Start a transaction on the Seller App.
   - Wait for 120 seconds without scanning.
   - **Verify**: The app should show "Session Expired" and reset the form.
2. **Brute Force Detection**:
   - Start a transaction.
   - Intentionally scan the *wrong* finger 6 times.
   - **Verify**: The backend should return a 429 "Session Locked" error.

## Troubleshooting
- **Connection Refused**: Double check your laptop's local IP (e.g. `192.168.1.XX`) in `POSScreen.tsx`.
- **"No Biometric Enrolled"**: Ensure your phone has at least one fingerprint setup in Android settings.
