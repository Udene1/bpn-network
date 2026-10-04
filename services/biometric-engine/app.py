from __future__ import annotations

import base64
import tempfile
from dataclasses import dataclass
from pathlib import Path
from threading import RLock
from typing import Optional

from afis import FingerprintProcessor, match_templates
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="BPN Biometric Engine", version="0.1.0-experimental")

_gallery_lock = RLock()
_gallery: dict[str, "GalleryEntry"] = {}
_processor = FingerprintProcessor(backend="auto")

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
        return _processor.process(str(path))
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Fingerprint processing failed: {exc}") from exc
    finally:
        path.unlink(missing_ok=True)

@app.get("/health")
def health():
    return {"ok": True, "service": "bpn-biometric-engine", "version": "0.1.0-experimental", "provider": "bpn-afis", "gallerySize": len(_gallery), "liveness": "UNIMPLEMENTED"}

@app.post("/v1/enroll")
def enroll(request: EnrollRequest):
    processed = _process(request)
    entry = GalleryEntry(request.user_id, processed.minutiae, getattr(processed.header, "image_quality", None), processed.header.height, processed.header.width)
    with _gallery_lock:
        _gallery[request.user_id] = entry
    return {"provider":"bpn-afis","providerReference":f"bpn-afis:{request.user_id}","userId":request.user_id,"modality":"FINGERPRINT","quality":entry.quality,"image":{"width":entry.image_width,"height":entry.image_height},"livenessVerified":False,"livenessStatus":"UNIMPLEMENTED"}

@app.post("/v1/identify")
def identify(request: IdentifyRequest):
    processed = _process(request)
    with _gallery_lock:
        candidates = list(_gallery.values())
    if not candidates:
        return {"provider":"bpn-afis","matched":False,"candidates":[],"livenessVerified":False,"livenessStatus":"UNIMPLEMENTED"}
    ranked = []
    for candidate in candidates:
        result = match_templates(processed.minutiae, candidate.fingerprint, method="safis", height_a=processed.header.height, height_b=candidate.image_height)
        score = float(result.score)
        ranked.append({"userId":candidate.user_id,"score":score,"matched":score >= request.threshold,"quality":candidate.quality})
    ranked.sort(key=lambda item:item["score"], reverse=True)
    top = ranked[:request.top_k]
    winner = top[0] if top and top[0]["matched"] else None
    return {"provider":"bpn-afis","matched":winner is not None,"userId":winner["userId"] if winner else None,"confidence":winner["score"] if winner else None,"candidates":top,"threshold":request.threshold,"livenessVerified":False,"livenessStatus":"UNIMPLEMENTED"}

@app.post("/v1/verify")
def verify(request: VerifyRequest):
    processed = _process(request)
    with _gallery_lock:
        candidate = _gallery.get(request.user_id)
    if candidate is None:
        raise HTTPException(status_code=404, detail="Biometric identity is not enrolled")
    result = match_templates(processed.minutiae, candidate.fingerprint, method="safis", height_a=processed.header.height, height_b=candidate.image_height)
    score = float(result.score)
    return {"provider":"bpn-afis","userId":request.user_id,"score":score,"matched":score >= request.threshold,"threshold":request.threshold,"livenessVerified":False,"livenessStatus":"UNIMPLEMENTED"}
