"""
File upload utility — validates type/size, stores to disk.

Usage:
    from app.core.file_upload import save_upload

    path = await save_upload(file, subdirectory="avatars", allowed_types=["image/jpeg", "image/png"])
"""
import os
import shutil
from uuid import uuid4
from typing import Optional, List

from fastapi import UploadFile, HTTPException

# Base upload directory
UPLOAD_BASE = os.environ.get("UPLOAD_DIR", "uploads")

ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
ALLOWED_DOC_TYPES = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


async def save_upload(
    file: UploadFile,
    subdirectory: str = "general",
    allowed_types: Optional[List[str]] = None,
    max_size: int = MAX_FILE_SIZE,
    filename_prefix: Optional[str] = None,
) -> str:
    """
    Save an uploaded file and return the relative path.
    Raises HTTPException on validation failure.
    """
    if allowed_types is None:
        allowed_types = ALLOWED_IMAGE_TYPES

    # Validate content type
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Allowed: {', '.join(allowed_types)}",
        )

    # Read and validate size
    contents = await file.read()
    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size // (1024 * 1024)} MB",
        )

    # Build path
    ext = (file.filename or "file").rsplit(".", 1)[-1] if file.filename and "." in file.filename else "bin"
    prefix = filename_prefix or str(uuid4())
    filename = f"{prefix}.{ext}"
    dir_path = os.path.join(UPLOAD_BASE, subdirectory)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, filename)

    # Write
    with open(file_path, "wb") as f:
        f.write(contents)

    return file_path


def delete_upload(file_path: str) -> bool:
    """Delete an uploaded file. Returns True if deleted, False if not found."""
    if file_path and os.path.exists(file_path):
        os.remove(file_path)
        return True
    return False
