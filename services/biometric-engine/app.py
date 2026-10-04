from __future__ import annotations

import base64
import tempfile
from dataclasses import dataclass
from pathlib import Path
from threading import RLock
from typing import Optional

from afis import MindtctExtractor
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="BPN Biometric Engine", version="0.1.1-experimental")

_gallery_lock = RLock()
_gallery: dict[str, "GalleryEntry"] = {}
_extractor = MindtctExtractor()


@dataclass
class GalleryEntry:
    user_id: str
    fingerprint: object
    quality: Optional[int]
    image_height: int
    image_width: int


class FingerprintRequest(BaseModel):
    image_base64: str = Field(min_length=16)
    image_mime: str = Field(default="image/jpeg")
    dpi: int = Field(default=500, ge=250, le=1000)


class EnrollRequest(FingerprintRequest):
    user_id: str = Field(min_length=1, max_length=128)


class VerifyRequest(FingerprintRequest):
    user_id: str = Field(min_length=1, max_length=128)
    threshold: float = Field(default=40.0, ge=0)


class IdentifyRequest(FingerprintRequest):
    threshold: float = Field(default=40.0, ge=0)
    top_k: int = Field(default=5, ge=1, le=20)


def _decode_image(payload: FingerprintRequest) -> Path:
    try:
        raw = base64.b64decode(payload.image_base64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid base64 fingerprint image") from exc

    if len(raw) < 64:
        raise HTTPException(status_code=400, detail="Fingerprint image is too small")

    suffix = ".png" if payload.image_mime.lower() == "image/png" else ".jpg"
    handle = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
    path = Path(handle.name)
    try:
        handle.write(raw)
        handle.flush()
    finally:
        handle.close()
    return path


def _process(payload: FingerprintRequest):
    path = _decode_image(payload)
    try:
        return _extractor.extract_minutiae(str(path))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Fingerprint processing failed: {exc}") from exc
    finally:
        path.unlink(missing_ok=True)


def _template_height(template: object) -> int:
    header = getattr(template, "header", None)
    height = getattr(header, "height", None)
    if height is None:
        raise HTTPException(status_code=422, detail="Fingerprint template did not expose image height")
    return int(height)


def _quality(template: object) -> Optional[int]:
    header = getattr(template, "header", None)
    value = getattr(header, "image_quality", None)
    return int(value) if value is not None else None


def _score(probe: object, candidate: object) -> float:
    try:
        result = _extractor.match(probe, candidate)
        return float(getattr(result, "score", result))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Fingerprint matching failed: {exc}") from exc


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "bpn-biometric-engine",
        "version": "0.1.1-experimental",
        "provider": "bpn-afis",
        "extractor": "mindtct",
        "gallerySize": len(_gallery),
        "liveness": "UNIMPLEMENTED",
    }


@app.post("/v1/enroll")
def enroll(request: EnrollRequest):
    processed = _process(request)
    entry = GalleryEntry(
        request.user_id,
        processed,
        _quality(processed),
        _template_height(processed),
        0,
    )
    with _gallery_lock:
        _gallery[request.user_id] = entry

    return {
        "provider": "bpn-afis",
        "providerReference": f"bpn-afis:{request.user_id}",
        "userId": request.user_id,
        "modality": "FINGERPRINT",
        "quality": entry.quality,
        "image": {"width": entry.image_width, "height": entry.image_height},
        "livenessVerified": False,
        "livenessStatus": "UNIMPLEMENTED",
    }


@app.post("/v1/identify")
def identify(request: IdentifyRequest):
    processed = _process(request)
    with _gallery_lock:
        candidates = list(_gallery.values())

    if not candidates:
        return {
            "provider": "bpn-afis",
            "matched": False,
            "candidates": [],
            "livenessVerified": False,
            "livenessStatus": "UNIMPLEMENTED",
        }

    ranked = []
    for candidate in candidates:
        score = _score(processed, candidate.fingerprint)
        ranked.append(
            {
                "userId": candidate.user_id,
                "score": score,
                "matched": score >= request.threshold,
                "quality": candidate.quality,
            }
        )

    ranked.sort(key=lambda item: item["score"], reverse=True)
    top = ranked[: request.top_k]
    winner = top[0] if top and top[0]["matched"] else None

    return {
        "provider": "bpn-afis",
        "matched": winner is not None,
        "userId": winner["userId"] if winner else None,
        "confidence": winner["score"] if winner else None,
        "candidates": top,
        "threshold": request.threshold,
        "livenessVerified": False,
        "livenessStatus": "UNIMPLEMENTED",
    }


@app.post("/v1/verify")
def verify(request: VerifyRequest):
    processed = _process(request)
    with _gallery_lock:
        candidate = _gallery.get(request.user_id)

    if candidate is None:
        raise HTTPException(status_code=404, detail="Biometric identity is not enrolled")

    score = _score(processed, candidate.fingerprint)
    return {
        "provider": "bpn-afis",
        "userId": request.user_id,
        "score": score,
        "matched": score >= request.threshold,
        "threshold": request.threshold,
        "livenessVerified": False,
        "livenessStatus": "UNIMPLEMENTED",
    }
