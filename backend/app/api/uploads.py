"""
File upload endpoints for user photos and ID documents.
Handles validation, storage, and cleanup.
"""
import os
import uuid
import shutil
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.models.user import User
from app.api.deps import get_current_active_staff

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")

PHOTO_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}
PHOTO_MAX_SIZE = 2 * 1024 * 1024  # 2 MB

ID_ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
ID_MAX_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_file(file: UploadFile, allowed_extensions: set, max_size: int, field_name: str) -> str:
    """Validate file type and size. Returns the file extension."""
    if not file.filename:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "errors": {field_name: "No filename provided"}
        })

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail={
            "success": False,
            "errors": {field_name: f"Invalid file type '{ext}'. Allowed: {', '.join(allowed_extensions)}"}
        })

    # Read content to check size
    content = file.file.read()
    if len(content) > max_size:
        max_mb = max_size / (1024 * 1024)
        raise HTTPException(status_code=400, detail={
            "success": False,
            "errors": {field_name: f"File too large. Maximum size is {max_mb:.0f} MB"}
        })

    # Reset file pointer for later use
    file.file.seek(0)
    return ext


def save_file(file: UploadFile, subfolder: str, ext: str) -> str:
    """Save file to disk and return the relative path."""
    folder_path = os.path.join(UPLOAD_DIR, subfolder)
    os.makedirs(folder_path, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    file_path = os.path.join(folder_path, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Return relative path from uploads dir
    return f"/uploads/{subfolder}/{filename}"


@router.post("/upload-photo")
async def upload_photo(
    photo: UploadFile = File(...),
    current_user: User = Depends(get_current_active_staff),
):
    """Upload a profile photo. Returns the stored file path."""
    ext = validate_file(photo, PHOTO_ALLOWED_EXTENSIONS, PHOTO_MAX_SIZE, "photo")
    path = save_file(photo, "photos", ext)
    return {"success": True, "path": path}


@router.post("/upload-id-document")
async def upload_id_document(
    id_document: UploadFile = File(...),
    current_user: User = Depends(get_current_active_staff),
):
    """Upload an ID document (NIC/passport). Returns the stored file path."""
    ext = validate_file(id_document, ID_ALLOWED_EXTENSIONS, ID_MAX_SIZE, "id_document")
    path = save_file(id_document, "id_documents", ext)
    return {"success": True, "path": path}
