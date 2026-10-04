# BPN Biometric SDK Evaluation

**Date:** 2026-10-04  
**Decision gate:** Production biometric provider selection

## Non-negotiable product requirement

BPN must allow an ordinary Android merchant phone to capture a customer's fingerprint, perform cross-device 1:N identification against the BPN enrolled population, return a BPN identity candidate with sufficient security evidence, and continue into BPN's transaction-bound authorization flow.

No dedicated biometric hardware is part of the product architecture.

## Candidate: Innovatrics IDKit / Embedded Biometrics

Public documentation confirms:
- Android support.
- Fingerprint 1:1 verification and 1:N identification.
- Enrollment/database support.
- On-device identification is supported for fingerprint.
- Fingerprint quality/presence metrics exist.
- Templates can be stored instead of fingerprint images, and database encryption is documented.

Important limitation to resolve:
- Public documentation indicates the Android fingerprint identification flow is available, but acquisition/capture responsibilities are split across SDK components. We need vendor confirmation of the exact smartphone camera/capture path and licensing package required for the merchant-phone use case.
- We also need to establish how a centrally enrolled BPN population can be securely made available to merchant devices without exposing the gallery or creating an unmanageable synchronization problem.

Source: Innovatrics IDKit documentation. citeturn0search0turn0search1turn0search8

## Candidate: IDEMIA Capture SDK

Public documentation confirms:
- Fingerprint capture on ordinary Android/iOS smartphones using the phone camera.
- Liveness for fingerprint capture.
- Fingerprint template extraction.
- 1:1 authentication and 1:N identification.
- Android integration documentation and native SDK components.

This is especially aligned with the no-custom-hardware requirement because the vendor explicitly describes smartphone-camera fingerprint capture. citeturn0search4turn0search5

Important limitation to resolve:
- Access is through a vendor-controlled SDK/distribution process.
- We need commercial/licensing terms, exact 1:N architecture, gallery size limits, React Native integration path, template interoperability, and security/assurance documentation before selection.

## Architecture decision

Do not integrate either vendor directly into payment code.

The selected SDK must implement the BPN biometric provider boundary with:
- enroll()
- identify()
- verifyAssertion()

The BPN payment system consumes a provider-neutral result.

## Selection gate

A provider is not accepted merely because it can recognize fingerprints.

It must demonstrate:
- same enrolled person recognized on a different Android device,
- 1:N identification,
- liveness / presentation-attack controls,
- secure biometric representation,
- provider assertion or equivalent integrity mechanism,
- acceptable false-match and false-reject characteristics,
- ordinary Android device support,
- React Native/native-module integration,
- acceptable latency,
- acceptable licensing,
- acceptable privacy/data handling,
- a viable architecture for a large BPN user gallery.

## Current result

**NO PROVIDER SELECTED.**

Innovatrics and IDEMIA are viable candidates worth vendor evaluation. The next practical step is obtaining SDK access/trials and building a throwaway biometric-provider proof of concept against the BPN interface. No vendor should yet be treated as part of the production architecture.
