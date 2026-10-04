# BPN Biometric Engine

Experimental, real fingerprint-recognition engine for BPN.

This is not a mock provider. It accepts real fingerprint images, performs real minutiae processing and real 1:1/1:N matching, but it is explicitly experimental and not production financial biometric authentication.

Current gaps: smartphone-camera capture quality, liveness/PAD, secure template persistence, gallery synchronization, device security, threshold calibration, regulatory/privacy review and financial-grade assurance.

Run with Python 3.10+:

    pip install -r requirements.txt
    uvicorn app:app --host 0.0.0.0 --port 8090

Endpoints:
- GET /
- GET /health
- POST /v1/enroll
- POST /v1/identify
- POST /v1/verify

The current matcher baseline is SAFIS/SourceAFIS-compatible so the experimental threshold scale is aligned with the documented SAFIS path. The first POC gallery is intentionally in-memory. We will not silently create a permanent biometric database before template protection and lifecycle controls are designed.

Threshold is an explicit request parameter. A prototype threshold may start at 40, but BPN will calibrate its own threshold against its actual capture dataset before using any biometric result for payment.
