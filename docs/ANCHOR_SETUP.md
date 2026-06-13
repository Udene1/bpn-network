# Anchor BaaS Sandbox Setup Guide

To test the BPN NIP transfer integration, you must configure your Anchor Dashboard correctly.

## 1. Get Sandbox API Keys
1. Log in to the [Anchor Dashboard](https://dashboard.getanchor.co).
2. Switch to **Sandbox Mode** in the bottom left.
3. Navigate to **Developer -> API Keys**.
4. Copy your **Secret Key** and paste it into `services/backend/.env` as `ANCHOR_API_KEY`.

## 2. Setup Test Counterparties
BPN requires a valid destination account to simulate a transfer.
1. In the Anchor Dashboard, go to **Transfers -> Counterparties**.
2. Create a new Counterparty:
   - **Bank**: Choose a mock bank (e.g., Access Bank).
   - **Account Number**: Use a dummy 10-digit number (e.g. `0012345678`).
   - **Name**: "BPN Seller Mock".
3. Use this account number in your `POSScreen.tsx` (or backend logic) as the `destinationAccount`.

## 3. Simulate Responses
Anchor Sandbox uses specific amounts to simulate different bank responses:
- **Success**: Any amount not listed below.
- **Insufficient Funds**: Use an amount ending in `.01` (e.g. `100.01`).
- **Timeout**: Use an amount ending in `.02`.
- **System Error**: Use an amount ending in `.03`.

## 4. Webhook Tunneling
To test the webhook handler locally:
1. Use `ngrok` or `localtunnel` to expose port `3000`.
   - `ngrok http 3000`
2. Copy the ngrok URL (e.g. `https://xyz.ngrok.io`).
3. In Anchor Dashboard, go to **Developer -> Webhooks**.
4. Set the URL to `https://xyz.ngrok.io/webhook/anchor`.
5. Select the event `transfer.updated`.
