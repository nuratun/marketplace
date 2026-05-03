from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

from app.db.session import get_db
from app.models.user import User
from app.models.otp import OTPCode
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class UpdateProfileRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    bio: str | None = None

class UpdateProfilePicRequest(BaseModel):
    profile_pic: str  # the R2 public URL

class PhoneRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    code: str

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "phone": current_user.phone,
        "name": current_user.name,
        "email": current_user.email,
        "profile_pic": current_user.profile_pic,
        "bio": current_user.bio,
        "standing": current_user.standing,
        "warning_reason": current_user.warning_reason,
        "user_type": current_user.user_type,
        "created_at": current_user.created_at.isoformat()
    }

@router.put("/me")
def update_me(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if body.name is not None:
        current_user.name = body.name
    if body.email is not None:
        current_user.email = body.email
    if body.bio is not None:
        current_user.bio = body.bio
    db.commit()
    db.refresh(current_user)
    return {
        "id": str(current_user.id),
        "phone": current_user.phone,
        "name": current_user.name,
        "email": current_user.email,
        "bio": current_user.bio,
        "profile_pic": current_user.profile_pic,
        "user_type": current_user.user_type,
        "standing": current_user.standing,
        "warning_reason": current_user.warning_reason,
        "created_at": current_user.created_at.isoformat()
    }

@router.put("/me/profile-pic")
def update_profile_pic(
    body: UpdateProfilePicRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    current_user.profile_pic = body.profile_pic
    db.commit()
    return {"profile_pic": current_user.profile_pic}

@router.post("/request-otp")
def request_otp(body: PhoneRequest, db: Session = Depends(get_db)):
    code = settings.OTP_DEV_BYPASS  # replace with random in prod
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    otp = OTPCode(phone=body.phone, code=code, expires_at=expires_at)
    db.add(otp)
    db.commit()

    # TODO: send SMS via Twilio here
    print(f"[DEV] OTP for { body.phone }: { code }")

    return { "message": "OTP sent" }

@router.post("/verify-otp")
def verify_otp(body: OTPVerifyRequest, response: Response, db: Session = Depends(get_db)):
    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.phone == body.phone,
            OTPCode.code == body.code,
            OTPCode.used == False,
            OTPCode.expires_at > datetime.utcnow()
        )
        .order_by(OTPCode.created_at.desc())
        .first()
    )

    if not otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    otp.used = True

    user = db.query(User).filter(User.phone == body.phone).first()
    if not user:
        user = User(phone=body.phone)
        db.add(user)

    db.commit()
    db.refresh(user)

    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="none" if settings.ENVIRONMENT == "production" else "lax",
        max_age=60 * 60 * 24 * 30
    )

    response.set_cookie(
        key="session",
        value="1",  # just a presence signal, no sensitive data
        httponly=False,  # readable by middleware
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",  # works cross-site for navigation requests
        max_age=60 * 60 * 24 * 30,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "phone": user.phone,
            "name": user.name,
            "email": user.email,
            "profile_pic": user.profile_pic,
            "bio": user.bio,
            "standing": user.standing,
            "warning_reason": user.warning_reason,
            "user_type": user.user_type,
            "created_at": user.created_at.isoformat()
        }
    }

@router.post("/refresh")
def refresh(response: Response, refresh_token: str = Cookie(None), db: Session = Depends(get_db)):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = db.query(User).filter(User.id == payload["sub"]).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        # Only set the cookie after we've confirmed the token is valid
        response.set_cookie(
            key="session",
            value="1",
            httponly=False,
            secure=settings.ENVIRONMENT == "production",
            samesite="lax",
            max_age=60 * 60 * 24 * 30,
        )
        return { "access_token": create_access_token(str(user.id)) }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")