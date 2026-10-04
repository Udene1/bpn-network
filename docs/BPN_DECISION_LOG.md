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

## Decision 007 — No mock biometric provider in the product path

**Date:** 2026-10-04  
**Decision:** BPN will not maintain a mock biometric provider in the application path. If a real provider is unavailable, biometric checkout remains explicitly unavailable rather than simulating identity.

**Reason:** We have limited engineering time before Zecathon. A mock would create cleanup debt and could be mistaken for evidence that the merchant-phone biometric flow works. Deterministic unit tests should test BPN contracts and authorization cryptography without pretending to perform biometric recognition.

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


## Decision 009 — IDEMIA is the leading technical candidate, not yet selected

**Date:** 2026-10-04  
**Decision:** IDEMIA Capture SDK is the leading candidate for the first real biometric POC because its official documentation explicitly describes fingerprint capture using an ordinary smartphone camera, liveness, template extraction, and 1:N identification on Android/iOS.

**Important qualification:** This is a technical-candidate decision, not a vendor selection. The SDK requires controlled distribution/licensing and native integration. We will not add vendor code, credentials, or invented APIs until legitimate SDK access is obtained.

**Selection gate:** same-person cross-device identification, liveness/PAD evidence, assertion/integrity model, gallery architecture, template protection, latency, device compatibility, licensing and privacy/security review must all pass before the provider is marked selected.


## Decision 010 — Build BPN's own biometric engine

**Date:** 2026-10-04  
**Decision:** BPN will build and own its biometric stack rather than making a commercial biometric vendor a prerequisite for the first real POC.

**Implementation:** The first recognition core is an open-source AFIS/SourceAFIS-compatible implementation behind a BPN-owned engine. This is not a mock. The engine processes real fingerprint images and performs real 1:1/1:N matching.

**Reason:** BPN currently has no budget for commercial biometric licensing or business-registration prerequisites, while the biometric requirement is the central technical risk that must be tested. Using an existing open recognition core lets BPN spend engineering time on the actual product problem: smartphone capture, enrollment, gallery, identity mapping, challenge-bound assertions, device integration, security controls and evidence.

**Constraint:** The engine is experimental. It must not be presented as production financial biometric authentication until capture quality, liveness/PAD, threshold calibration, template protection, gallery security, device security, privacy/legal review and real-device accuracy testing pass.

**Follow-up:** Build Android capture first; then validate Android-to-Android cross-device identification before integrating the result into payment.
