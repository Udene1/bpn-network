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

## Decision 011 — Biometric engine is real recognition, not a mock
Date: 2026-10-04
Decision: The BPN-owned biometric engine may use an existing open recognition core initially, but every match used as evidence must come from actual fingerprint image processing and matching.
Constraint: No hard-coded users, synthetic scores, fake success responses, or Android BiometricPrompt substitution.
Reason: We need a zero/near-zero-cost path to validate the central BPN cross-device biometric thesis without paying for a commercial vendor. BPN's own surrounding SDK/protocol remains the strategic layer.
Follow-up: Validate real Android camera capture and cross-device 1:N matching before connecting biometric identification to payment execution.

## Decision 012 — No synthetic product data
Date: 2026-10-04
Decision: Remove random fallback values from production-facing BPN metrics and use cryptographically secure randomness for transaction/session identifiers.
Reason: The project is being built as a real product and test evidence must correspond to actual state.

## Decision 013 — Physical-device test matrix uses the available phones
Date: 2026-10-04
Decision: The first real BPN biometric test will use two physical Infinix Android phones as the primary cross-device validation pair. Two iPhones are a secondary capture/cross-platform experiment if the Expo camera build runs on them.
Reason: The core risk is whether a real fingerprint captured by one ordinary smartphone can be recognized against a previously enrolled fingerprint from another ordinary smartphone. Physical-device evidence is required; emulator or BiometricPrompt evidence is insufficient.
Test matrix:
- Android A enroll -> Android B identify
- Android B enroll -> Android A identify
- iPhone A enroll -> iPhone B identify, if available
- Android A enroll -> iPhone A identify, if image quality/engine compatibility permits
- iPhone A enroll -> Android A identify, if image quality/engine compatibility permits
Constraint: A successful capture alone is not a successful biometric match. Record image quality, extraction result, score, threshold, latency, false-match/non-match observations and failure conditions.

## Decision 014 — Self-enrollment is the default; merchant-assisted enrollment is an exception
Date: 2026-10-04
Decision: Buyers normally enroll on their own phone. Merchant-assisted enrollment exists only for buyers who do not have a phone or cannot complete self-enrollment.

Normal path:
- buyer uses their own phone for enrollment;
- the phone protects the buyer's local biometric credential;
- the buyer does not need the phone at checkout after enrollment.

Assisted path:
- merchant uses an ordinary smartphone to capture the buyer's fingerprint;
- buyer identity, bank account and explicit consent are collected during the assisted flow;
- the biometric provider receives the real capture and returns a provider reference;
- BPN records the enrollment method as MERCHANT_ASSISTED;
- raw fingerprint images are not persisted by BPN;
- bank mandate authorization remains a separate customer authorization step.

Reason: This preserves the original BPN inclusion goal without turning merchant enrollment into the normal path. A buyer with a phone should retain control of their biometric enrollment, while people without phones must still be able to participate.

Constraint: The current merchant-assisted route is experimental until real-device fingerprint quality, provider extraction, gallery persistence/security, liveness/PAD, authorization binding and banking-rail tests pass.


## Decision 015 — AWS Seller runtime is a temporary external blocker, not a reason to fake biometric evidence

Date: 2026-10-04

Decision: The current physical biometric test is blocked because the Seller application is hosted through AWS App Builder and that runtime is currently unavailable. BPN development continues on independent backend, biometric-engine, payment, security and documentation work. The physical-device biometric test remains a required gate and is not marked passed by simulation.

Reason: The BPN biometric thesis requires real camera capture from an ordinary merchant smartphone. A mock, synthetic score, Android BiometricPrompt substitution, or simulated payment would produce misleading evidence.

Constraint: Record the blocker and its cause in BPN_TEST_RESULTS.md. When a usable Seller runtime or a replacement deployment is available, resume the exact physical-device test matrix rather than changing the acceptance criteria.


## Decision 016 — Payment infrastructure must fail closed rather than silently simulate unavailable dependencies

Date: 2026-10-04

Decision: Required production dependencies such as JWT_SECRET, Redis, merchant authentication and Anchor webhook verification must fail closed when missing. BPN will not silently fall back to mock secrets, mock Redis behavior, synthetic watchlists, fake PINs or unverified webhook processing.

Reason: The project is being built as real payment infrastructure. Silent fallbacks make a green test result meaningless and can create security defects that are difficult to detect.

Constraint: Development environments may use explicit local configuration, but the code path must not pretend an unavailable production dependency is working.

## Decision 017 — Funding account selection is part of the signed payment authorization

Date: 2026-10-04

Decision: When a buyer has multiple linked bank accounts, the selected funding account is an authorization input, not merely UI state. The account ID is bound into the payment challenge and signed authorization proof.

Reason: BPN must not display one account to the customer and debit another account because of backend defaulting or race conditions.

Constraint: If no account is explicitly selected, the current default-account policy may be used. If an account is selected, it must belong to the credential owner and have a usable mandate before payment execution.


## Decision 018 — Redis remains mandatory; health probes must stay observable while it is unavailable

Date: 2026-10-05

Decision: Redis is still a required operational dependency for sessions, rate limiting and idempotency. If Redis is unavailable, those operational routes must fail closed with HTTP 503 rather than silently falling back. Liveness and database-readiness probes are exempt so infrastructure diagnosis can continue.

Reason: BPN must be able to distinguish “Neon/Prisma is healthy” from “Redis is unavailable” without weakening payment/security behavior.

Constraint: This does not make the backend production-ready. A legitimate Redis deployment must be configured and verified before payment/session flows are considered operational.
