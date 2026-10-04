# BPN Production Readiness

Purpose: This is the long-lived engineering plan for taking BPN from prototype/hackathon software to a production payment network. Zecathon readiness is a milestone, not the definition of done.

## Identity and enrollment
- [ ] Replace prototype BVN handling with an approved identity-verification integration and documented consent/legal basis.
- [ ] Define authoritative BPN identity lifecycle: create, verify, suspend, recover, merge, delete/export where legally required.
- [ ] Define account-linking verification and ownership checks with participating banks/rails.
- [ ] Remove generated/mock phone numbers and prototype identity values.
- [ ] Define credential lifecycle: issue, rotate, revoke, recover, re-enroll, device loss, multiple authenticators.
- [x] Store BPN public credential rather than treating fingerprint data as the network credential.
- [ ] Complete authenticator interoperability for the intended checkout experience.

## Biometric and authenticator security
- [ ] Complete threat model for customer-phone and merchant-side BPN authenticator modes.
- [ ] Use platform secure hardware/keystore where available; document key exportability and device binding.
- [ ] Define liveness/PAD requirements for any BPN-certified biometric authenticator.
- [ ] Define false-accept/false-reject targets and independent biometric security testing for identification components.
- [ ] Never make raw biometric templates a general BPN network payload.
- [ ] Define device compromise, lost-device, credential-revocation and recovery procedures.
- [ ] Perform penetration testing and mobile reverse-engineering/security review.

## Payment rails and banking integration
- [x] Isolate payment rails behind a BPN rail interface.
- [x] Keep Anchor as a development/integration rail without making Anchor the BPN product definition.
- [x] Create an explicit NIBSS rail boundary without inventing undocumented NIBSS APIs.
- [ ] Obtain and validate appropriate NIBSS staging/sandbox access and contracts.
- [ ] Validate direct-debit mandate creation, authorization, execution, status and reversal against the real production target.
- [ ] Implement authoritative webhook verification and idempotency.
- [ ] Reconcile every BPN transaction against bank/rail settlement records.
- [ ] Define timeout, retry, duplicate, reversal, chargeback/dispute and partial-failure behavior.
- [ ] Ensure transaction correlation IDs are stable across BPN, rail and bank callbacks.
- [ ] Establish settlement, treasury and merchant payout/reconciliation processes.

## Transaction integrity and risk
- [ ] Make the state machine authoritative: CREATED -> AUTHORIZED -> PROCESSING -> COMPLETED / FAILED / REVERSED, with explicit legal transitions.
- [ ] Never display PENDING as payment success.
- [x] Make authorization transaction-bound and replay-resistant.
- [ ] Define velocity, amount, device, credential and behavioral risk controls.
- [ ] Add production fraud monitoring, alerting and case management.
- [ ] Define transaction limits and step-up authentication rules.
- [ ] Establish dispute, refund, reversal and chargeback workflows.

## API and application security
- [ ] Authenticate and authorize every payment-sensitive endpoint.
- [ ] Remove public administrative/payment mutation routes or protect them with proper merchant/customer credentials.
- [ ] Verify webhook signatures and enforce replay protection.
- [ ] Replace default/fallback cryptographic keys and prototype secrets.
- [ ] Use authenticated encryption where encryption is required; establish KMS/HSM-backed key management.
- [ ] Apply strict schema validation, rate limits, abuse controls and audit logging.
- [ ] Define secret rotation and emergency credential revocation procedures.
- [ ] Run SAST, dependency scanning, DAST/API security tests and mobile security testing.

## Privacy, compliance and governance
- [ ] Complete Nigerian NDPA/NDPR-aligned privacy assessment with specialist legal review.
- [ ] Complete biometric-specific DPIA/PIA before production biometric identification.
- [ ] Define data minimization, retention and deletion schedules.
- [ ] Define user consent, notice, withdrawal and account-recovery procedures.
- [ ] Document controller/processor responsibilities across BPN, banks, rails and vendors.
- [ ] Define audit-log retention and access controls.
- [ ] Establish incident response and breach-notification procedures.

## Merchant and customer product readiness
- [ ] Finish the real merchant Android checkout flow.
- [ ] Support clear customer confirmation before money moves.
- [ ] Support multiple linked accounts and explicit account selection/defaulting.
- [ ] Provide reliable receipts and transaction history from authoritative backend data.
- [ ] Define merchant onboarding/KYB, settlement and suspension flows.
- [ ] Define customer support, failed-payment and recovery journeys.
- [ ] Test low-connectivity and interrupted-checkout behavior.
- [ ] Test accessibility and supported Android device range.

## Reliability and operations
- [ ] Production database backups, point-in-time recovery and restore drills.
- [ ] Observability: structured logs, metrics, traces and payment-specific dashboards.
- [ ] Alerting for payment failures, rail degradation, fraud spikes, reconciliation gaps and authentication failures.
- [ ] Define SLOs/SLIs and incident severity levels.
- [ ] Disaster-recovery plan and tested failover.
- [ ] Queue/outbox strategy for reliable payment events where required.
- [ ] Safe deployment, migration rollback and feature-flag strategy.
- [ ] Capacity/load testing and database/index tuning.

## Testing and evidence
- [ ] Unit, integration, API contract, E2E, security, recovery and edge-case suites cover critical money movement paths.
- [ ] Test both Anchor and the eventual NIBSS implementation against the same BPN contract.
- [ ] Test duplicate requests, retries, timeout after debit, webhook replay, out-of-order callbacks and reconciliation mismatches.
- [ ] Test credential revocation, device loss, re-enrollment and authenticator failure.
- [ ] Run mobile device matrix testing.
- [ ] Run load and failure-injection tests.
- [ ] Record EVERY material test result in project history, including date/commit/environment, behavior observed, not merely pass/fail, failures, fixes and remaining risk.
- [ ] CI results must be preserved with the corresponding milestone/commit.

## Release governance
- [ ] Separate development, staging and production environments and credentials.
- [ ] No production secrets in source control or shared development environments.
- [ ] Require review for payment/security changes.
- [ ] Maintain release notes and migration plans.
- [ ] Define rollback criteria before production releases.
- [ ] Complete operational readiness review before launch.
- [ ] Complete independent security review before real-money production use.

## Definition of production ready
BPN is production-ready only when identity, authentication, payment rails, transaction state, security, privacy/compliance, reconciliation, reliability, operations, support and recovery have been validated with evidence in the intended production environment. Passing a hackathon demo is not sufficient.

## Current milestone
Zecathon: build a credible, working demonstration of the production architecture.
Production: continue from this document until every critical control has evidence, real banking/identity integrations are approved and tested, and real-money operational readiness has been signed off.