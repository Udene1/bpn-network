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

## 2026-10-04 — Removed mock biometric provider path
Commit: pending
Environment: GitHub repository; source-level verification only.
Scope: Remove the default/mock biometric provider configuration path so an unconfigured deployment fails closed.
Expected behavior: Missing biometric provider configuration must disable biometric payments rather than select a simulated provider.
Observed behavior: Factory now requires BPN_BIOMETRIC_PROVIDER and rejects uninstalled providers.
Result: PASS (source inspection only)
Remaining risk: No real SDK adapter is installed yet; biometric checkout remains intentionally unavailable until a real provider is integrated and tested on physical devices.


## 2026-10-04 — Biometric SDK candidate evidence review
Environment: Official vendor documentation review; no SDK credentials or binary installed.
Scope: Validate whether a real provider can satisfy BPN's ordinary-smartphone, fingerprint, liveness and 1:N requirements before writing vendor-specific code.
Expected behavior: Candidate must have documented capabilities matching the BPN checkout requirement.
Observed behavior: IDEMIA officially documents smartphone-camera fingerprint capture, liveness, biometric extraction and 1:1/1:N comparison on Android/iOS; SDK distribution/licensing is controlled.
Result: PASS (documentation capability gate only)
Decision: IDEMIA becomes the leading technical candidate but is NOT selected until SDK access and a real-device POC are completed.
Remaining risk: No real SDK binary, credentials, merchant-device capture, cross-device gallery test, or financial checkout test has been performed.


## 2026-10-04 — Own biometric engine foundation

Environment: GitHub repository; source-level implementation only.  
Scope: Add BPN experimental biometric engine using a real AFIS/SourceAFIS-compatible recognition path, with enrollment, 1:N identification, 1:1 verification and explicit threshold handling.

Expected behavior:
- No mock identity or synthetic match result.
- Real fingerprint images are processed.
- Enrollment creates a real biometric representation in the POC gallery.
- Identification ranks real candidates.
- Liveness is explicitly reported as unimplemented rather than claimed.

Observed behavior:
- Engine service and test contract added under services/biometric-engine.
- Gallery is intentionally in-memory.
- Health endpoint explicitly reports liveness as UNIMPLEMENTED.
- Threshold is caller-controlled.
- Invalid image input is rejected.

Result: PASS (source-level implementation only)

Remaining risk:
- Dependencies have not been installed/executed in CI yet.
- No real fingerprint image has been processed in this repository environment.
- No smartphone-camera capture has been tested.
- No cross-device identification has been performed.
- No liveness/PAD exists.
- No production biometric security claim is permitted.

## 2026-10-04 — Biometric engine CI execution attempt
Commit: 0e8d9bad8011da13586e1e71c16e8e0093fdd496
Environment: GitHub Actions configuration added for services/biometric-engine.
Scope: Install the real AFIS dependency and execute pytest against the biometric engine contract.
Expected behavior: Dependencies install successfully and health/invalid-image contract tests execute.
Observed behavior: Workflow configuration was committed, but GitHub exposed zero workflow runs for the commit.
Result: BLOCKED
Root cause: No workflow execution was exposed after the workflow commit; dependency installation and runtime tests therefore remain unverified.
Remaining risk: The AFIS dependency/API compatibility, FastAPI runtime and matching implementation have not yet been executed in CI.

## 2026-10-04 — Removal of synthetic application data
Commit: 0c5dbdac0d4edd553e21b38251b54e005d637d41
Environment: GitHub repository; source-level verification.
Scope: Remove random dashboard transaction-volume fallback and random invoice session token generation.
Expected behavior: Product metrics must reflect stored transactions; session tokens must use a cryptographically secure generator.
Observed behavior: Dashboard empty days now report zero volume; success rate is calculated from persisted COMPLETED transactions; invoice tokens use crypto.randomBytes.
Result: PASS (source inspection only)
Remaining risk: Backend compilation/runtime still requires CI execution.


## 2026-10-04 — Physical-device capture preparation

Commits: de5127f2, ca89507d, ec00fb90
Environment: GitHub repository; source/configuration inspection only.
Scope: Prepare seller Android app for real camera access and remove a synthetic buyer phone number from enrollment.
Expected behavior:
- Seller app has the camera dependency/configuration needed for a physical-device capture experiment.
- Buyer enrollment uses a supplied phone number rather than generating fake contact data.
Observed behavior:
- expo-camera dependency and camera permission configuration are present in the seller app.
- Buyer enrollment now requires and submits the entered phone number.
Result: PASS (source/configuration inspection only)
Remaining risk:
- Camera capture UI has not yet been executed on either Infinix device.
- No fingerprint image has been processed by the AFIS engine from a physical phone.
- Cross-device identification, image quality, liveness/PAD and latency remain unverified.
