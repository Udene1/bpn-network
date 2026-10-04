# BPN Biometric Engine — 2026-10-04

## Decision

BPN will build and own its biometric stack instead of making a commercial biometric vendor a prerequisite for the first real proof of the product.

The first implementation uses an open recognition core behind a BPN-owned engine/API. This is deliberate: BPN owns the product boundary, capture contract, enrollment lifecycle, identity mapping, gallery, matching policy, challenge binding, assertions, device integration and evidence. The recognition core can be replaced or progressively rewritten later.

## Recognition baseline

The initial engine uses the AFIS Python toolkit with its SAFIS/SourceAFIS-compatible matching path. SourceAFIS supports fingerprint image processing and 1:1/1:N matching and its Java implementation is usable on Android API 24+. The AFIS toolkit provides minutiae extraction, matching and quality tooling.

## Why this is real

The engine accepts actual fingerprint images, extracts biometric features and computes real similarity scores. There is no hard-coded identity, synthetic match response or mock provider.

## Why this is not production

The current implementation is an experimental POC. It does not yet provide validated smartphone-camera capture, liveness/PAD, secure persistent template storage, gallery synchronization, device compromise resistance, calibrated financial thresholds, or regulatory/privacy approval.

The initial gallery is in-memory specifically to avoid silently creating an unsafe permanent biometric database.

## First real POC

1. Capture a real fingerprint image on an ordinary Android phone.
2. Enroll it under a BPN test identity.
3. Capture the same finger on a second Android phone.
4. Identify it against the enrolled gallery.
5. Return the BPN identity candidate and score.
6. Bind the result to the BPN transaction challenge.
7. Require explicit payment confirmation.
8. Execute the configured development payment rail.
9. Record the complete result in BPN_TEST_RESULTS.md.

No production claim is made until this is tested on physical devices with measured false-match and false-non-match behavior.
