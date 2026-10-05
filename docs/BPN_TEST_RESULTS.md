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

## 2026-10-04 — Real-device capture harness
Environment: BPN Seller Expo app; implementation preparation only.
Scope: Add a real camera capture screen that sends captured JPEG bytes to the BPN biometric-engine enrollment/1:N identification API. The screen is intentionally separate from payment checkout until physical capture quality and cross-device matching are proven.
Expected: Use the phone camera, not Android BiometricPrompt or a mock signature; enrollment and identification send actual captured image data; no payment is executed by this harness.
Observed: Seller app now has a dedicated Biometric Capture route using expo-camera. Engine URL is configurable with EXPO_PUBLIC_BPN_BIOMETRIC_ENGINE_URL. Capture returns base64 JPEG data and calls /v1/enroll or /v1/identify.
Result: PASS (source/configuration implementation only)
Remaining risk: Not yet executed on the two Infinix Android phones. Fingerprint image usability, focus, lighting, extraction, cross-device identification and latency remain unverified. iOS capture is implemented through Expo camera but unverified on the two iPhones. Liveness/PAD remains UNIMPLEMENTED.

## 2026-10-04 — Enrollment-mode separation and merchant-assisted enrollment implementation

**Environment:** source implementation only; physical biometric execution not performed.

**Scope:** Distinguish normal buyer self-enrollment from the exceptional merchant-assisted enrollment path.

**Implementation:**
- User.enrollmentMethod added with PHONE default.
- User.phoneNumber is nullable so a buyer without a phone can exist in the assisted path.
- Added /merchant-assisted-enroll.
- Assisted route requires explicit consent, BVN, name, bank account and a real fingerprint image capture.
- The configured real biometric provider is called before the BPN user record is created, using a generated user ID.
- Assisted enrollment records MERCHANT_ASSISTED and provider reference; raw capture is not persisted by BPN.
- Seller biometric capture UI now exposes an explicit Assisted mode.

**Expected:** self-enrollment remains the default; assisted enrollment is available only when needed; no mock biometric result is introduced.

**Observed:** source changes committed successfully. No runtime or physical-device verification has yet been performed.

**Result:** IMPLEMENTED / UNVERIFIED.

**Remaining risk:** the current AFIS engine is experimental and in-memory; smartphone camera fingerprint quality, cross-device matching, liveness/PAD, persistent protected gallery, merchant authentication, mandate completion and end-to-end payment remain unverified.

## 2026-10-04 — Provider biometric identity persistence

**Environment:** source implementation only.

**Scope:** Connect real biometric enrollment to BPN's user record without storing raw fingerprint images in the BPN database.

**Implemented:** Added BpnBiometricIdentity with provider, providerReference, modality and lifecycle status. Normal phone enrollment can submit a real biometric capture to the configured provider and persists only the returned provider reference. Merchant-assisted enrollment now persists the same provider identity reference.

**Expected:** BPN owns the identity-to-provider binding while the provider/engine owns the biometric representation. Raw camera images are not persisted in PostgreSQL.

**Observed:** schema, migration and backend changes committed successfully. Runtime/provider execution remains unverified because the experimental AFIS engine has not yet completed a real physical-device test.

**Result:** IMPLEMENTED / UNVERIFIED.

**Remaining risk:** provider references currently point to an in-memory experimental gallery; deletion/revocation, encrypted persistent gallery, gallery synchronization, liveness/PAD and cross-device matching remain outstanding.

## 2026-10-04 — AFIS engine deployment

**Environment:** Vercel production deployment, FastAPI/Python runtime.

**Scope:** Make the experimental real biometric engine reachable from physical Android devices.

**Method:** Created Vercel project `bpn-biometric-engine` linked to `Udene1/bpn-network`, root `services/biometric-engine`, production branch `main`. Vercel detected FastAPI and built the Python function.

**Observed:** Build completed successfully in 12s. The build reported the `afis` package was force-bundled because no compatible wheel was detected for the Vercel runtime, with a 321.69 MB bundle before optimization. Deployment state was still BUILDING at verification time, so HTTP health verification is pending.

**Client configuration:** Seller biometric capture harness now defaults to the deployed engine URL while still allowing an explicit override.

**Result:** DEPLOYED / RUNTIME HEALTH UNVERIFIED.

**Important limitation:** The AFIS gallery is in-memory. This deployment is only a physical-device experiment; it is not a production biometric store and must not be used for financial authorization.


## 2026-10-04 — AWS Seller runtime blocked; continue non-device work

Environment: AWS App Builder Seller application; external runtime availability as observed by the user.

Scope: Attempted transition from source/configuration readiness to the first physical fingerprint capture using the Seller app.

Expected: The AWS-hosted Seller application should be available so a physical Android device can open the BPN biometric capture screen and send a real camera capture to the Vercel biometric engine.

Observed: AWS App Builder is currently unavailable, so the Seller app cannot be used for the planned physical-device capture test at this time.

Result: BLOCKED — external application runtime unavailable.

Root cause: The current Seller runtime depends on AWS App Builder, which is unavailable for the test window. This is an environment/infrastructure blocker, not evidence of biometric-engine failure.

Decision: Do not substitute a mock fingerprint, synthetic match, Android BiometricPrompt signature, or simulated payment success merely to keep the test green. Continue building and validating independent BPN components while preserving the physical-device test as pending.

Next validation required when a usable Seller runtime is available: Infinix Android A enroll -> Vercel AFIS engine -> Infinix Android B identify, with capture quality, extraction, score, threshold, latency and failure behavior recorded.


## 2026-10-04 — Legacy payment path stopped generating synthetic bank references

Commit: 1d73dde2134fc603100d6b2b907d6e714a6e46ac

Environment: GitHub repository; source-level inspection.

Scope: Correct the legacy `/match-and-pay` payment-recording path so it uses the payment rail's returned reference and actual rail status instead of generating a random local reference and always recording PENDING.

Expected: Every persisted transaction should retain the authoritative payment-rail reference and accurately map COMPLETED, FAILED or PENDING state.

Observed: The path now persists `result.reference`, maps the returned rail status to BPN transaction state, and records a state-appropriate audit action. No payment rail was executed during this change.

Result: PASS (source inspection only).

Remaining risk: Runtime/payment-rail integration, webhook reconciliation, idempotency and the legacy route's overall security remain unverified. This does not make `/match-and-pay` the preferred biometric path; the BPN credential/provider flow remains the intended architecture.

## 2026-10-04 — Backend security, Redis fail-closed, fraud-state and Anchor webhook hardening

Commits: 1cbc1e3d, 1c4203be, ea66cdf4, 8f3c17d7, ae912b4d, 996b608d, d2a310c9

Environment: GitHub repository; source-level inspection. External Anchor webhook documentation verified.

Scope:
- protect merchant/payment-sensitive routes with a configured BPN merchant key;
- require JWT_SECRET instead of a source-code fallback;
- fail startup when Redis cannot connect instead of silently falling back;
- remove synthetic fraud watchlist entries and count COMPLETED transactions;
- add atomic Redis idempotency primitive;
- verify Anchor webhook signatures using the documented HMAC-SHA1 scheme and raw request body;
- deduplicate Anchor events and reconcile initiated/successful/failed/reversed transfer events;
- remove the PIN fallback and return the actual payment state.

Expected: security-sensitive paths fail closed when required infrastructure/secrets are absent; fraud state reflects the real transaction state; Anchor events cannot mutate state without signature verification and duplicate protection.

Observed: source changes implement the controls. No deployed backend runtime or live Anchor webhook has been exercised in this change window.

Result: IMPLEMENTED / RUNTIME UNVERIFIED.

Remaining risk: merchant API key lifecycle/rotation, full merchant identity/role model, backend deployment, live Anchor sandbox webhook delivery, reconciliation against Anchor's verify-transfer API, and end-to-end payment remain outstanding.


## 2026-10-04 — Vercel backend deployment path prepared

Commit: ef2cc4ed0ac158aae1db789887f51b844144634e

Environment: Vercel; project `bpn-backend`, linked to `Udene1/bpn-network`, root `services/backend`.

Observed: Vercel project and production-branch deployment were created successfully. Deployment is currently QUEUED. Node 24 was explicitly configured because Vercel is deprecating Node 20 for new deployments.

Result: DEPLOYMENT PREPARED / RUNTIME UNVERIFIED.

Blocker: The new Vercel project does not yet have the required production secrets/infrastructure values (DATABASE_URL, REDIS_URL, JWT_SECRET, BPN_MERCHANT_API_KEY, Anchor credentials/webhook secret, and any biometric-engine configuration) configured. No secret values were invented or copied into source.

Next step: provision legitimate environment values, then execute deployed health, auth-negative, payment-state and Anchor webhook verification tests.

## 2026-10-04 — Seller capture configuration cleanup

Commits: 3f11910b, feaa16a9

Environment: GitHub repository; source/configuration inspection.

Scope:
- replace stale biometric-engine deployment URL in Seller config with the stable Vercel project alias;
- correct duplicate/misplaced Expo `plugins` configuration so `expo-camera` is declared under `expo.plugins`.

Expected: A future Seller build should point at the current Vercel biometric engine by default and Expo should process the camera plugin from valid app configuration.

Observed: Source/configuration corrected. Physical Seller build remains blocked by AWS App Builder availability.

Result: PASS (source/configuration only).

Remaining risk: no physical Android build or camera capture has been executed; merchant-assisted backend now requires merchant authentication and the mobile client does not embed the merchant secret.


## 2026-10-04 — Vercel backend build failure diagnosed and corrected

Initial deployment: `dpl_4kt1qJifV1muwsBtNPbJx9XLuRS6`

Observed Vercel build errors:
- Prisma generated client did not contain the already-migrated `enrollmentMethod` field because `schema.prisma` had drifted from the migration history.
- Prisma model types therefore also retained non-null `phoneNumber`.
- Two biometric-provider imports lacked required `.js` extensions under NodeNext/ESM TypeScript resolution.

Corrections:
- aligned `schema.prisma` with the `20261004190000_enrollment_method` migration;
- added `prisma generate && tsc` to the build;
- corrected biometric-provider ESM import extensions.

Result: ROOT CAUSE IDENTIFIED / FIX COMMITTED / REDEPLOY PENDING.

Remaining risk: the deployed backend still requires legitimate PostgreSQL, Redis, Anchor and biometric assertion configuration before runtime can be considered healthy.

## 2026-10-04 — Funding-account selection bound to authorization

Commits: 4858af31, c31d7a0f, 6fd3cfc8

Scope: Extend the BPN authorization challenge/proof so a buyer with multiple linked bank accounts can explicitly select a funding account before authorization.

Expected:
- challenge may carry a selected account ID;
- selected account must belong to the credential owner;
- the selected account is included in the signed authorization payload;
- authorization cannot silently switch to another account;
- challenge response exposes masked account choices for explicit confirmation.

Observed: Source implementation now validates ownership, binds account selection into the challenge/proof and chooses the bound account during payment. No payment runtime executed.

Result: IMPLEMENTED / RUNTIME UNVERIFIED.

Remaining risk: account ownership verification, mandate state and physical/mobile confirmation UI remain unverified.


## 2026-10-04 — Independent Seller Android test build path

Commit: e89b289d286467d66a7b153756e819cc55c6bfcb

Environment: GitHub Actions source configuration.

Scope: Remove dependence on AWS App Builder for the next physical Seller capture experiment by adding an independent CI path that generates an installable Android debug APK from the Expo Seller project.

Expected: When GitHub Actions executes the workflow, it should prebuild the Expo app, compile the Android project and publish `app-debug.apk` as an artifact.

Observed: Workflow configuration committed successfully. Execution is pending; no APK is claimed as built yet.

Result: IMPLEMENTED / EXECUTION UNVERIFIED.

Remaining risk: Expo/Gradle compatibility, Android build time, camera runtime behavior and network reachability to the Vercel biometric engine remain unverified.


## 2026-10-05 — Vercel backend build/runtime verification

Commits: 84c26a4, 6deeea2, 70631a3

Environment: Vercel production, project `bpn-backend`.

Scope:
- deploy the Prisma database readiness probe;
- verify the production build;
- invoke the real `/health/db` endpoint;
- diagnose runtime startup failure.

Observed:
- Deployment `dpl_4XsrtZYidEeDD6AJofaR1xu7hc4J` initially failed at TypeScript compilation because the readiness probe had literal escaped backticks in `src/index.ts`.
- The compiler reported TS1127/TS1005/TS1434 errors and an unterminated template literal.
- Commit `6deeea2250bd77401a547c09859c6695981d7ca5` corrected the probe syntax.
- Deployment `dpl_3YYsFRySP6gpFdW5QcYPsyK4xA3f` then reached READY and received the production aliases, including `bpn-backend-one.vercel.app`.
- A real request to `/health/db` reached the deployed function but returned Vercel `FUNCTION_INVOCATION_FAILED`.
- Vercel environment inspection shows Neon integration variables, including `DATABASE_URL` and `POSTGRES_PRISMA_URL`, are present for production.
- No `REDIS_URL` is configured. The backend currently initializes Redis during startup, so the missing Redis dependency prevents the function from completing startup before the Prisma probe can execute.

Correction:
- Commit `70631a3cfc4001d937952b10a23de427c1791c64` keeps liveness/readiness probes reachable when Redis is unavailable.
- Operational routes remain fail-closed with HTTP 503 while Redis is disconnected; the change does not silently enable sessions, rate limiting, idempotency or payment flows without Redis.

Result: BUILD PASS / DEPLOY PASS / DATABASE RUNTIME UNVERIFIED / REDIS BLOCKED.

Next test: redeploy, invoke `/health/db` again, then configure a legitimate Redis deployment and repeat operational smoke tests.


## 2026-10-05 — Prisma → Neon production runtime verification

Deployment: `dpl_BmN16pTQDcHjcGsPiCacy5UT3RjB`  
URL: `bpn-backend-aiqc4628t-udenes-projects-8089646b.vercel.app`

Method:
- invoked the deployed `GET /health/db` endpoint;
- endpoint executes a real Prisma `$queryRaw` `SELECT 1`;
- production environment is backed by the connected Neon integration.

Observed:
`HTTP 200` with:
`{"ok":true,"service":"bpn-backend","database":"reachable","orm":"prisma"}`

Result: **PASS — Prisma can reach Neon from the deployed BPN backend.**

Important boundary:
- This verifies database connectivity only.
- Redis is still not configured, so operational routes remain fail-closed.
- Anchor credentials/webhook secret and biometric assertion secret are still required before payment/biometric runtime can be considered operational.
