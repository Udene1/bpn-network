# BPN Engineering Decision Log

This file is the durable record of decisions that define the BPN architecture. Decisions should be recorded when made, not reconstructed later from memory.

## Decision 001 — BPN is a cardless payment network

**Date:** 2026-10-04  
**Decision:** BPN's product identity is a cardless payment network. The core checkout experience must not require a customer card or customer phone.

**Target experience:**
1. Merchant enters the amount on an ordinary Android phone.
2. Customer places a finger on that merchant phone.
3. BPN identifies the customer.
4. BPN shows the customer's identity and masked funding account.
5. Customer explicitly confirms the amount.
6. BPN executes payment through the configured banking rail.
7. Merchant receives a receipt only after authoritative payment completion.

## Decision 002 — No custom biometric hardware

**Date:** 2026-10-04  
**Decision:** BPN will pursue a software/SDK-only biometric implementation. We will not spend engineering time designing or requiring dedicated biometric hardware.

**Reason:** Smartphone-based fingerprint capture and 1:N identification are available as software/SDK capabilities, so this is the engineering path worth validating first. Android-focused biometric SDKs also exist with fingerprint 1:N identification capabilities. citeturn0search5turn0search9turn0search12

**Constraint:** SDK availability does not equal production suitability. Any selected provider must still pass security, liveness, privacy, accuracy, licensing, Android compatibility, latency and financial-use review.

## Decision 003 — Do not use Android BiometricPrompt for cross-device recognition

**Date:** 2026-10-04  
**Decision:** Android's platform biometric authentication remains useful for device-local cryptographic authorization, but it is not BPN's cross-device biometric identification mechanism.

**Reason:** Android's biometric APIs authenticate biometric credentials on the current device and can protect authentication-bound cryptographic keys. They do not provide BPN with a portable fingerprint template/identity that can simply be moved to another phone. citeturn0search0turn0search2

## Decision 004 — Biometric recognition is a replaceable provider

**Date:** 2026-10-04  
**Decision:** BPN will define a vendor-neutral `BpnBiometricProvider` boundary. The rest of BPN must not depend directly on a biometric SDK.

**Provider responsibilities:**
- enrollment
- 1:N identification
- biometric modality handling
- liveness/quality signals where supported
- production-grade assertion generation
- assertion verification

**BPN responsibilities:**
- BPN identity
- credential/payment authorization
- transaction challenge
- account selection
- fraud/risk policy
- banking rail execution
- audit/evidence

## Decision 005 — Biometric identity and payment authorization remain separate

**Date:** 2026-10-04  
**Decision:** A biometric match answers **who is present**; it does not by itself debit an account.

The payment flow must remain:

Biometric identification -> BPN identity -> payment challenge -> explicit customer confirmation -> payment authorization -> banking rail

This preserves the existing BPN credential/payment-authorization work while allowing the biometric provider to change independently.

## Decision 006 — Current credential work is retained

**Date:** 2026-10-04  
**Decision:** The existing BPN public-key credential and transaction-bound authorization protocol remains part of the architecture. It is not replaced by the biometric SDK.

The biometric provider identifies the BPN identity. The BPN authorization layer proves/records authorization of the specific payment.

## Decision 007 — Mock biometric provider is test-only

**Date:** 2026-10-04  
**Decision:** A mock provider may exist for deterministic development and CI, but it must never be treated as production biometric security or evidence of real biometric interoperability.

## Next decision gate

Before selecting a production SDK, compare candidates against:
- Android support and React Native/native integration
- fingerprint 1:N identification
- enrollment and template lifecycle
- liveness / presentation-attack resistance
- on-device vs server processing
- template protection and exportability
- cryptographic assertion capability
- accuracy / false-match / false-non-match characteristics
- offline behavior and latency
- licensing and commercial terms
- privacy/data residency implications
- ability to operate on ordinary Android phones
- suitability for regulated financial payments
