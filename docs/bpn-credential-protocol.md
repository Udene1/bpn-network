# BPN Credential Authorization Protocol

## Core rule

BPN does not treat a fingerprint as a network credential. A biometric is a local authentication event that unlocks or authorizes a BPN cryptographic credential. The network transports credential identifiers and transaction-specific authorization proofs.

## Enrollment

1. User provides BVN/identity details and links one or more bank accounts.
2. The buyer device creates a BPN credential key pair through the platform biometric/secure-key facility.
3. The private key remains protected by the device authenticator.
4. BPN receives and stores only the credential ID and public key.
5. The BPN credential is linked to the BPN identity and selected funding accounts.

The existing biometric-template model is retained only for legacy compatibility during migration. New authorization flows do not use it.

## Payment authorization

```text
Merchant creates invoice
        |
        v
BPN payment challenge
        |
        |  transaction-bound payload
        v
BPN Authenticator
        |
        | local biometric verification
        v
BPN credential signs challenge
        |
        | credential ID + signature
        v
BPN authorization service
        |
        | verify signature against registered public key
        v
Risk controls
        |
        v
Payment rail (Anchor / NIBSS)
```

The signed payload binds the authorization to:

- BPN protocol version
- payment session
- credential ID
- merchant/seller ID
- exact amount

A signature from another transaction cannot be replayed against a different amount or merchant.

## API protocol

### `POST /payment/challenge`

Merchant supplies `sessionToken` and `credentialId`. BPN returns a short-lived, transaction-specific challenge payload.

### `POST /payment/authorize`

An authenticator returns:

```json
{
  "version": "BPN-AUTH-1",
  "sessionToken": "...",
  "credentialId": "cred_...",
  "sellerId": "...",
  "amount": 25000,
  "signature": "base64-signature"
}
```

BPN verifies the signature using the registered public key, consumes the challenge, applies risk controls, and only then invokes the payment rail.

## Authenticator boundary

The network intentionally separates the **authenticator** from the **credential**.

A customer-phone authenticator can use the device biometric to unlock the credential and sign the challenge. A future BPN-certified merchant-side biometric authenticator can produce the same BPN authorization proof without requiring the customer's phone at checkout.

This is deliberate: standard Android biometric APIs authenticate biometrics enrolled on the device running the app; they do not provide a portable fingerprint template that a merchant phone can use to identify a customer. BPN therefore defines its own portable credential/proof protocol rather than attempting to move biometric data between devices.

## Current implementation status

- BPN credential model and migration: implemented.
- Public-key registration during buyer enrollment: implemented.
- Transaction-bound challenge generation: implemented.
- RSA-SHA256 authorization-proof verification: implemented.
- Replay protection through one-time Redis challenges: implemented.
- Buyer-side biometric credential generation/signing wrapper: implemented.
- Merchant-side transport of a customer proof: **next integration boundary**. Do not replace this with the merchant phone's own biometric signature; that would authenticate the merchant device, not the customer.
- Anchor/NIBSS payment rail abstraction: already implemented separately.
