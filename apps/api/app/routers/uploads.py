import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from app.core.r2 import generate_presigned_upload, public_url
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}

class PresignRequest(BaseModel):
    filename: str
    content_type: str

class PresignResponse(BaseModel):
    upload_url: str   # PUT to this
    public_url: str   # store this in image_urls after upload

class PresignProfileRequest(BaseModel):
    content_type: str = "image/jpeg"

@router.post("/presign", response_model=list[PresignResponse])
def presign_uploads(
    files: list[PresignRequest],
    current_user: User = Depends(get_current_user),
):
    if len(files) > 5:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Maximum 5 images per listing")

    results = []
    for f in files:
        if f.content_type not in ALLOWED_CONTENT_TYPES:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {f.content_type}"
            )
        ext = f.filename.rsplit(".", 1)[-1].lower() if "." in f.filename else "jpg"
        key = f"listings/{current_user.id}/{uuid.uuid4()}.{ext}"
        results.append(PresignResponse(
            upload_url=generate_presigned_upload(key, f.content_type),
            public_url=public_url(key)
        ))

    return results

@router.post("/presign-profile")
def presign_profile(
    body: PresignProfileRequest,
    current_user: User = Depends(get_current_user),
):
    allowed = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
    if body.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    
    ext = allowed[body.content_type]
    key = f"profiles/{current_user.id}.{ext}"
    
    upload_url = generate_presigned_upload(key, body.content_type)
    return {"upload_url": upload_url, "public_url": public_url(key)}