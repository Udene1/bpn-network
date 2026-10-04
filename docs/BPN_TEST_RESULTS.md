# BPN Test Results and Engineering Evidence

This file is the durable index for material BPN verification results. EVERY material test result must be recorded here or in a linked detailed result document. A green test is evidence; a red test is also evidence and must not be erased after the fix.

## Recording format
- Date/time
- Commit SHA
- Environment
- Test name/scope
- Command or verification method
- Expected behavior
- Observed behavior
- Result: PASS / FAIL / BLOCKED
- Failure/root cause if applicable
- Fix commit(s)
- Remaining risk or follow-up

## 2026-10-04 — BPN credential authorization foundation
Commit series: 6205f007, 28e7ae81, d267ade0, 0c408b54, 0b0d680e, ffbe61b2, a035f061, 6762e2f7, b5f8d3ba, c185dcc8
Scope: BPN credential/public-key registration, transaction-bound authorization challenges, one-time challenge consumption, buyer-side credential creation/signing wrapper, and credential protocol documentation.
Verification status: BLOCKED — automated project test/build execution has not yet been run after this change set.
What was verified: source-level inspection confirmed separation between biometric triggering and network authorization proof, and the repository contains a dedicated cryptographic unit test for signature verification.
What remains unverified: TypeScript compilation, Prisma generation/migration application, mobile build, backend test suite, API E2E flow, Redis-backed challenge lifecycle, and real-device biometric/key behavior.
Risk: The credential protocol is an implementation foundation, not evidence of production interoperability or a complete end-to-end payment.

## 2026-10-04 — Payment status integrity + CI verification attempt
Commit series: ee24db4, 77bf38a, 8ac13be
Environment: GitHub repository / intended GitHub Actions Ubuntu runner.
Scope: Persist actual banking-rail result status; use stable session-derived idempotency; prevent PENDING from displaying as payment success; add backend CI.
Observed behavior: source changes committed; workflow present; GitHub Actions API exposed zero workflow runs.
Result: BLOCKED
Remaining risk: TypeScript compilation and runtime behavior remain unverified. Seller primary biometric path remained legacy.

## 2026-10-04 — Biometric provider abstraction
Commit series: b99429a4, a3ae074a, c380b7eb, e9f6342e
Environment: GitHub repository; source-level verification only.
Scope: Introduce vendor-neutral BpnBiometricProvider boundary, provider factory, durable architecture decision log, and production-readiness updates.
Expected behavior:
- BPN core must not depend directly on a biometric vendor SDK.
- Provider boundary must model enrollment, 1:N identification and assertion verification.
- Merchant-phone biometric recognition remains the target experience.
- No custom biometric hardware is part of the product architecture.
Observed behavior:
- Provider interface and configuration boundary are present.
- Decision log records the software/SDK-only decision and separation of biometric identification from payment authorization.
- Production readiness tracks SDK selection, 1:N validation, liveness, privacy and merchant-phone integration as open work.
Result: BLOCKED
Reason: No real biometric SDK has been integrated or tested yet, and project compilation has not been rerun after these changes.
Remaining risk: The provider contract is architectural groundwork, not evidence that a specific SDK can recognize the same enrolled fingerprint across different Android phones.
 
## Previous repository test evidence
Existing BPN test suites cover portions of API, security, E2E, recovery, dashboard and Anchor behavior. Historical results should remain in the repository and be updated with new runs rather than overwritten.

## Rule
Never write tested when only source inspection occurred. Distinguish source inspection, unit tests, integration tests, device tests, staging tests and production verification.


## 2026-10-04 — Platform-neutral seller biometric boundary
Commit series: 65867f45, 1057b06e, 2777325c, 757b2d69
Environment: GitHub repository; source-level verification only.
Scope: Add Android/iOS platform detection, seller provider registry boundary, explicitly demote device-local React Native biometrics to legacy compatibility, and define the real-device biometric POC matrix.
Expected behavior:
- Seller biometric selection is platform-aware without putting platform logic into payment code.
- Device-local biometric signatures are not represented as fingerprint templates.
- Real SDK integration remains blocked until an approved provider is selected.
Observed behavior:
- Platform detection and provider registry are present.
- Legacy sensor is explicitly documented as device-local and unsuitable for cross-device customer identification.
- POC defines Android-to-Android, iPhone-to-iPhone and cross-platform tests.
Result: BLOCKED
Reason: No production biometric SDK has been integrated and no real-device test has been executed.
Remaining risk: Checkout still uses the legacy biometric path until the selected provider adapter is implemented and verified.
