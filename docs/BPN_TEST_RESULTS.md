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
Commit series: ee24dbd4, 77bf38a4, 8ac13be
Environment: GitHub repository / intended GitHub Actions Ubuntu runner.
Scope: Persist the actual banking-rail result status for credential-authorized payments; use a stable session-derived idempotency key; prevent the seller POS from displaying PENDING as PAYMENT SUCCESSFUL; add backend CI verification workflow.
Expected behavior:
- A rail response of COMPLETED/successful becomes a COMPLETED BPN transaction.
- PENDING remains PENDING until an authoritative rail update.
- FAILED becomes FAILED.
- Repeated authorization of the same payment session uses the same idempotency key.
- The seller UI only shows a successful receipt for COMPLETED.
- CI runs Prisma generation and TypeScript compilation.
Observed behavior:
- Source changes were committed successfully.
- GitHub Actions workflow file is present on main.
- GitHub Actions API currently reports zero workflow runs for the repository, so no runner execution result is available yet.
Result: BLOCKED
Failure/root cause: No workflow run was exposed by the repository Actions API after the workflow commit; the underlying reason (Actions disabled, connector visibility, or trigger behavior) is not established from the available evidence.
Fix commits: ee24dbd4, 77bf38a4, 8ac13be
Remaining risk: TypeScript compilation and runtime behavior remain unverified. The seller's primary biometric path still depends on the legacy device-level biometric/template flow and must be replaced by a genuine BPN authenticator design before production.

## Previous repository test evidence
Existing BPN test suites cover portions of API, security, E2E, recovery, dashboard and Anchor behavior. Historical results should remain in the repository and be updated with new runs rather than overwritten.

## Rule
Never write tested when only source inspection occurred. Distinguish source inspection, unit tests, integration tests, device tests, staging tests and production verification.