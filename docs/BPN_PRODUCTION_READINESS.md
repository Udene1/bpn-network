# BPN Production Readiness

This is the long-lived engineering plan for taking BPN from prototype/hackathon software to a production payment network. Zecathon readiness is a milestone, not the definition of done.

## Identity and enrollment
- [x] BPN public credential foundation exists.
- [ ] Approved BVN/identity verification integration.
- [ ] Authoritative identity and credential lifecycle.
- [ ] Account-linking ownership verification.
- [ ] Authenticator interoperability for the intended checkout.

## Biometric and authenticator security
- [x] Cross-device biometric recognition is modeled as a replaceable provider.
- [x] Product architecture is software/SDK only; no custom biometric hardware.
- [ ] Select and validate a production fingerprint SDK/provider.
- [ ] Validate fingerprint 1:N accuracy and false-match controls.
- [ ] Validate liveness/presentation-attack resistance.
- [ ] Validate provider template protection and cryptographic assertions.
- [ ] Complete biometric threat model, mobile security review and privacy/DPIA.
- [ ] Define credential revocation, device loss and re-enrollment.

## Payment rails and banking integration
- [x] Payment rails isolated behind a BPN interface.
- [x] Anchor remains a development/integration rail.
- [x] NIBSS has an explicit boundary without invented endpoints.
- [ ] Obtain appropriate NIBSS staging/sandbox access.
- [ ] Validate real mandate/payment/reversal behavior.
- [ ] Implement authoritative webhook verification, idempotency and reconciliation.
- [ ] Stabilize transaction correlation across BPN and banking rails.

## Transaction integrity and risk
- [x] Authorization is transaction-bound and replay-resistant.
- [x] Seller POS no longer treats PENDING as success.
- [ ] Make the transaction state machine authoritative.
- [ ] Production fraud monitoring, limits and step-up controls.
- [ ] Dispute, refund, reversal and chargeback workflows.

## Merchant/customer product
- [ ] Replace legacy seller device-level biometric/template flow with BpnBiometricProvider.
- [ ] Implement merchant-phone 1:N identification.
- [ ] Show masked identity/funding account before explicit confirmation.
- [ ] Support multiple linked accounts and account selection/defaulting.
- [ ] Receipt only after authoritative payment completion.
- [ ] Test low-connectivity and interrupted checkout.

## Security, privacy and operations
- [ ] Authenticate every payment-sensitive endpoint.
- [ ] Remove prototype/default secrets and use managed key protection.
- [ ] Verify webhooks and enforce replay protection.
- [ ] Complete Nigerian data-protection and biometric DPIA review.
- [ ] Backups, recovery, observability, alerting and disaster recovery.
- [ ] Load, failure-injection and mobile device testing.

## Temporary external infrastructure blockers
- [ ] AWS App Builder Seller runtime restored or replaced with a usable deployment.
- [ ] Physical-device biometric capture resumed after Seller runtime becomes available.
- [x] Blocked runtime is recorded as BLOCKED rather than converted into simulated evidence.

## Testing and evidence
- [x] Durable test-results record exists.
- [x] Durable engineering decision log exists.
- [ ] Record every material build, unit, integration, device, staging and production result in docs/BPN_TEST_RESULTS.md.
- [ ] Real-device biometric accuracy/liveness evidence.
- [ ] End-to-end merchant-phone payment evidence.
- [ ] Failure/retry/replay/reversal/reconciliation evidence.

## Definition of production ready
BPN is production-ready only when identity, authentication, payment rails, transaction state, security, privacy/compliance, reconciliation, reliability, operations, support and recovery have been validated with evidence in the intended production environment. A hackathon demo is not sufficient.

## Temporary infrastructure / deployment
- [ ] AWS Seller runtime restored or replaced with a usable deployment.
- [ ] Backend deployed to a supported production/staging runtime with required PostgreSQL/Redis/secrets.
- [ ] Physical-device biometric capture resumed after Seller runtime is available.
- [ ] Backend runtime smoke tests and security negative tests executed in deployed environment.

## Webhook and reconciliation
- [x] Anchor webhook signature verification implemented against Anchor's documented HMAC-SHA1 scheme.
- [x] Anchor webhook event idempotency guard implemented.
- [ ] Live/sandbox Anchor webhook delivery verified.
- [ ] Reconciliation job using authoritative Anchor status/verify-transfer endpoint.
- [ ] Full reversal and dispute/recovery workflow.

## Backend deployment migration
- [x] Vercel project created for `services/backend` and linked to GitHub main.
- [x] Node 24 target configured.
- [ ] Configure production DATABASE_URL.
- [ ] Configure production REDIS_URL.
- [ ] Configure JWT_SECRET.
- [ ] Configure BPN_MERCHANT_API_KEY.
- [ ] Configure Anchor API/webhook secrets.
- [ ] Configure BPN biometric engine URL/assertion secret.
- [ ] Execute deployed runtime smoke/security tests.

## Seller app deployment / capture
- [x] Stable Vercel biometric-engine alias configured.
- [x] Expo camera plugin configuration corrected.
- [ ] Obtain usable Seller app runtime/build outside AWS App Builder.
- [ ] Physical Android capture and cross-device AFIS identification.
- [ ] iOS physical capture validation.

- [x] Diagnose initial Vercel backend build failure.
- [x] Align Prisma schema and migration history.
- [x] Generate Prisma client during build.
- [x] Correct NodeNext ESM imports.
- [ ] Confirm successful Vercel backend build after fixes.

## Funding account and confirmation
- [x] Multiple linked accounts represented.
- [x] Selected account can be bound to transaction authorization.
- [x] Masked funding-account choices returned before authorization.
- [ ] Mobile confirmation UI validated on device.
- [ ] Account ownership/mandate verification against authoritative bank rail.
