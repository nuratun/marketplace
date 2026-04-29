from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import random

from app.db.session import get_db
from app.models.user import User
from app.models.otp import OTPCode
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

class PhoneRequest(BaseModel):
    phone: str

class OTPVerifyRequest(BaseModel):
    phone: str
    code: str

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
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 30
    )

    return {
        "access_token": access_token,
        "is_new_user": user.name is None,
        "user": { "id": str(user.id), "phone": user.phone, "name": user.name }
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
        return { "access_token": create_access_token(str(user.id)) }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")