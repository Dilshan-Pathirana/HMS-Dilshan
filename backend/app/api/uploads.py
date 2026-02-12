docker exec -i <mysql-container> mysql -uhms -phms hms_local < aws_migration.sql"""File upload utilities and router."""
from __future__ import annotations

import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from starlette.responses import JSONResponse

router = APIRouter()

# ─── Constants ────────────────────────────────────────
PHOTO_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
PHOTO_MAX_SIZE = 5 * 1024 * 1024  # 5 MB

ID_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
ID_MAX_SIZE = 10 * 1024 * 1024  # 10 MB

UPLOADS_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"


# ─── Helpers ──────────────────────────────────────────
def validate_file(
    file: UploadFile,
    allowed_extensions: set,
    max_size: int,
    label: str = "file",
) -> str:
    """Validate extension and size.  Returns the file extension (e.g. '.jpg')."""
    if not file.filename:
        raise HTTPException(status_code=400, detail=f"{label}: filename is required")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"{label}: extension '{ext}' not allowed. Allowed: {allowed_extensions}",
        )

    # Read content to check size, then seek back
    content = file.file.read()
    file.file.seek(0)
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"{label}: file size ({len(content)} bytes) exceeds limit ({max_size} bytes)",
        )
    return ext


def save_file(file: UploadFile, subfolder: str, ext: str) -> str:
    """Save an uploaded file and return its relative path (from uploads root)."""
    dest_dir = UPLOADS_DIR / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = dest_dir / filename

    content = file.file.read()
    file.file.seek(0)
    with open(dest_path, "wb") as f:
        f.write(content)

    # Return path relative to uploads root so it can be served via /uploads/...
    return f"{subfolder}/{filename}"


# ─── Router endpoints ────────────────────────────────
@router.post("/photo")
async def upload_photo(file: UploadFile = File(...)):
    """Upload a photo file."""
    ext = validate_file(file, PHOTO_ALLOWED_EXTENSIONS, PHOTO_MAX_SIZE, "photo")
    path = save_file(file, "photos", ext)
    return {"success": True, "path": f"/uploads/{path}"}


@router.post("/document")
async def upload_document(file: UploadFile = File(...)):
    """Upload an ID / document file."""
    ext = validate_file(file, ID_ALLOWED_EXTENSIONS, ID_MAX_SIZE, "document")
    path = save_file(file, "id_documents", ext)
    return {"success": True, "path": f"/uploads/{path}"}
