# BPN Biometric Provider POC

Date: 2026-10-04

## Objective

Prove the actual BPN checkout requirement before selecting a production biometric vendor.

The POC must use an ordinary compatible smartphone and a real fingerprint capture SDK. It must not use Android BiometricPrompt as a substitute for cross-device recognition.

## Required flow

1. Enrol a test person into a BPN identity.
2. Capture fingerprint data using the selected provider.
3. Protect the provider representation according to the provider's supported architecture.
4. Open a merchant payment challenge for a known amount.
5. Capture the same person's fingerprint on a different merchant device.
6. Perform 1:N identification.
7. Return a BPN identity candidate plus confidence/quality/liveness evidence.
8. Require explicit confirmation of the amount and funding account.
9. Produce a provider assertion bound to the payment challenge.
10. Send the authorization into the existing BPN payment orchestration.

## Device matrix

| Test | Device A | Device B | Expected |
|---|---|---|---|
| A1 | Android | Android | Same enrolled person identified |
| A2 | iPhone | iPhone | Same enrolled person identified |
| A3 | Android | iPhone | Same enrolled person identified if provider supports cross-platform gallery/representation |
| A4 | iPhone | Android | Same enrolled person identified if provider supports cross-platform gallery/representation |

A provider failing A1 is rejected. A provider that cannot support the desired cross-platform architecture must document that limitation.

## Security gates

The POC must record:

- liveness/presentation-attack controls
- biometric quality thresholds
- false match / false non-match observations
- confidence scoring
- template/reference protection
- whether raw fingerprint images ever leave the device
- where matching occurs
- gallery synchronization mechanism
- assertion integrity
- replay resistance
- revocation/deletion behavior
- offline behavior
- latency
- SDK licensing constraints

## Important architecture constraint

The merchant application must not own BPN's biometric security model.

The selected SDK adapter implements:

- capture
- enrollment
- identification
- provider-specific representation handling
- liveness/quality
- assertion generation

BPN owns:

- BPN identity
- payment challenge
- explicit confirmation
- payment authorization
- fraud/risk policy
- bank-rail execution
- audit evidence

## Current status

POC NOT STARTED.

IDEMIA is currently the strongest documented candidate for this specific requirement because its public documentation explicitly describes fingerprint capture, liveness, 1:1 authentication and 1:N identification using modern Android or iOS smartphones with standard cameras. Actual vendor access, licensing and integration testing are still required before selection. citeturn0search0turn0search1turn0search3


## 2026-10-04 — Physical-device test inventory

The first real-device experiment has a practical test pool available:
- Android: 2 Infinix phones.
- iOS: 2 iPhones, available for a later cross-platform capture experiment if the camera capture path proves viable.

### Test order
1. Infinix A: capture/enroll a real test finger.
2. Infinix B: capture the same finger and attempt 1:N identification.
3. Repeat with a different finger/person to measure false-match behavior.
4. Repeat multiple captures of the same finger to measure false-non-match behavior.
5. Record capture dimensions, image quality, processing time, matching score, configured threshold and result for every attempt.
6. Only after Android-to-Android behavior is measured, test iPhone-to-iPhone and Android-to-iPhone/iPhone-to-Android if the capture representation is sufficiently compatible.

### Important boundary
The two Infinix phones and two iPhones are test devices, not evidence that ordinary phone cameras are suitable fingerprint sensors. The experiment must establish whether the captured images contain enough ridge detail for the AFIS pipeline. A failed capture experiment is a valid engineering result and must remain recorded.
