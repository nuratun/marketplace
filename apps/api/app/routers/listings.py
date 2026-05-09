from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import uuid

from app.db.session import get_db
from app.models.listing import Listing
from app.models.user import User
from app.core.dependencies import get_current_user, get_optional_user
from app.models.saved_listing import SavedListing

router = APIRouter(prefix="/listings", tags=["listings"])

# ── Schemas ──────────────────────────────────────────────

class ListingCreate(BaseModel):
    title: str
    description: str
    price: float
    currency: str = "USD"
    category: str
    condition: str
    city: str
    attrs: Optional[dict] = None
    image_urls: Optional[list[str]] = None

class ListingStatusUpdate(BaseModel):
    status: str  # "sold" only for now

class ListingOut(BaseModel):
    id: str
    title: str
    description: str
    price: float
    currency: str
    category: str
    condition: str
    city: str
    status: str
    image_urls: list[str]
    views: int
    created_at: datetime
    expires_at: datetime
    seller: dict

    class Config:
        from_attributes = True

# ── Helpers ───────────────────────────────────────────────

def serialize_listing(listing: Listing, seller: User) -> dict:
    return {
        "id": str(listing.id),
        "title": listing.title,
        "description": listing.description,
        "price": float(listing.price),
        "currency": listing.currency,
        "category": listing.category,
        "condition": listing.condition,
        "city": listing.city,
        "status": listing.status,
        "attrs": listing.attrs or {},
        "image_urls": listing.image_urls or [],
        "views": listing.views,
        "created_at": listing.created_at.isoformat(),
        "expires_at": listing.expires_at.isoformat(),
        "seller": {
            "id": str(seller.id),
            "name": seller.name,
            "member_since": seller.created_at.strftime("%B %Y"),
        },
    }

VALID_STATUSES = { "active", "sold", "expired" }
VALID_CURRENCIES = { "USD", "SYP" }
VALID_CONDITIONS = { "new", "used" }
VALID_SORT = {
    "newest": desc(Listing.created_at),
    "price_asc": asc(Listing.price),
    "price_desc": desc(Listing.price)
}

# ── Endpoints ─────────────────────────────────────────────

@router.post("", status_code=201)
def create_listing(
    body: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if body.currency not in VALID_CURRENCIES:
        raise HTTPException(status_code=400, detail="Invalid currency")
    if body.condition not in VALID_CONDITIONS:
        raise HTTPException(status_code=400, detail="Invalid condition")
    if body.price <= 0:
        raise HTTPException(status_code=400, detail="Price must be greater than 0")

    listing = Listing(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=body.title.strip(),
        description=body.description.strip(),
        price=body.price,
        currency=body.currency,
        category=body.category,
        condition=body.condition,
        city=body.city,
        status="active",
        attrs=body.attrs,
        image_urls=body.image_urls or [],
        expires_at=datetime.utcnow() + timedelta(days=30)
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    return serialize_listing(listing, current_user)


@router.get("")
def list_listings(
    category: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Listing).filter(
        Listing.status == "active",
        Listing.expires_at > datetime.utcnow()
    )

    if category:
        query = query.filter(Listing.category == category)
    if city:
        query = query.filter(Listing.city == city)
    if condition:
        query = query.filter(Listing.condition == condition)
    if min_price is not None:
        query = query.filter(Listing.price >= min_price)
    if max_price is not None:
        query = query.filter(Listing.price <= max_price)

    sort_expr = VALID_SORT.get(sort, desc(Listing.created_at))
    query = query.order_by(sort_expr)

    total = query.count()
    listings = query.offset((page - 1) * limit).limit(limit).all()

    user_ids = [l.user_id for l in listings]
    sellers = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": -(-total // limit),  # ceiling division
        "results": [
            serialize_listing(l, sellers[l.user_id])
            for l in listings
            if l.user_id in sellers
        ]
    }

@router.get("/mine", dependencies=[])
def get_my_listings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Listing).filter(Listing.user_id == current_user.id)

    if status:
        query = query.filter(Listing.status == status)

    query = query.order_by(desc(Listing.created_at))

    total = query.count()
    listings = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": -(-total // limit),
        "results": [serialize_listing(l, current_user) for l in listings]
    }

@router.get("/saved", dependencies=[])
def get_saved_listings(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns all listings saved by the current user, newest save first."""
    saved_rows = (
        db.query(SavedListing)
        .filter(SavedListing.user_id == current_user.id)
        .order_by(SavedListing.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
 
    total = (
        db.query(SavedListing)
        .filter(SavedListing.user_id == current_user.id)
        .count()
    )
 
    listing_ids = [row.listing_id for row in saved_rows]
    listings = db.query(Listing).filter(Listing.id.in_(listing_ids)).all()
 
    # Preserve the save order (newest first)
    listing_map = {l.id: l for l in listings}
    ordered = [listing_map[lid] for lid in listing_ids if lid in listing_map]
 
    user_ids = [l.user_id for l in ordered]
    sellers = {
        u.id: u
        for u in db.query(User).filter(User.id.in_(user_ids)).all()
    }
 
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": -(-total // limit),
        "results": [
            serialize_listing(l, sellers[l.user_id])
            for l in ordered
            if l.user_id in sellers
        ]
    }

@router.get("/{listing_id}")
def get_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # increment views (skip for owner)
    if not current_user or current_user.id != listing.user_id:
        listing.views += 1
        db.commit()

    seller = db.query(User).filter(User.id == listing.user_id).first()
    return serialize_listing(listing, seller)

@router.delete("/{listing_id}", status_code=204)
def delete_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    db.delete(listing)
    db.commit()

@router.patch("/{listing_id}/status")
def update_listing_status(
    listing_id: str,
    body: ListingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if body.status not in {"sold"}:
        raise HTTPException(status_code=400, detail="You can only mark a listing as sold")

    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    listing.status = body.status
    db.commit()
    return {"message": "Status updated", "status": listing.status}

@router.get("/{listing_id}/phone")
def reveal_phone(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    seller = db.query(User).filter(User.id == listing.user_id).first()
    return { "phone": seller.phone }

@router.post("/{listing_id}/save", status_code=201)
def save_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
 
    # Idempotent: already saved → just return success
    existing = (
        db.query(SavedListing)
        .filter(
            SavedListing.user_id == current_user.id,
            SavedListing.listing_id == listing.id,
        )
        .first()
    )
    if existing:
        return {"saved": True}
 
    saved = SavedListing(user_id=current_user.id, listing_id=listing.id)
    db.add(saved)
    db.commit()
    return {"saved": True}
 
 
@router.delete("/{listing_id}/save", status_code=200)
def unsave_listing(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    saved = (
        db.query(SavedListing)
        .filter(
            SavedListing.user_id == current_user.id,
            SavedListing.listing_id == listing_id,
        )
        .first()
    )
    if saved:
        db.delete(saved)
        db.commit()
    return {"saved": False}