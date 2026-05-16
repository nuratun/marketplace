import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import Integer, cast, func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.listing import Listing
from app.models.rating import Rating
from app.models.user import User

router = APIRouter(tags=["ratings"])


# ── Request / Response schemas ───────────────────────────────────────────────

class RatingCreate(BaseModel):
    score: int = Field(..., ge=1, le=5)
    recommended: bool
    role: str = Field(..., pattern="^(buyer|seller)$")


class RatingOut(BaseModel):
    id: str
    listing_id: str
    rater_id: str
    ratee_id: str
    role: str
    score: int
    recommended: bool
    created_at: str

    # Rater's public name — handy for the profile page
    rater_name: str | None = None


class RatingSummary(BaseModel):
    total: int
    average_score: float | None   # None when no ratings yet
    recommend_pct: float | None   # 0–100, None when no ratings yet


# ── Helper: recalculate and persist denormalized stats ───────────────────────

def _refresh_user_stats(db: Session, user_id: uuid.UUID) -> None:
    """Recompute average_rating and rating_count on the users row."""
    result = db.execute(
        select(
            func.count(Rating.id).label("total"),
            func.avg(Rating.score).label("avg_score"),
        ).where(Rating.ratee_id == user_id)
    ).one()

    user = db.get(User, user_id)
    if user:
        user.rating_count = result.total or 0
        user.average_rating = (
            round(Decimal(str(result.avg_score)), 2) if result.avg_score else None
        )
    db.commit()

# ── POST /listings/{listing_id}/rate ─────────────────────────────────────────

@router.post("/listings/{listing_id}/rate", response_model=RatingOut, status_code=201)
def submit_rating(
    listing_id: uuid.UUID,
    body: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Listing must exist
    listing = db.get(Listing, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    # 2. Listing must be sold
    if listing.status != "sold":
        raise HTTPException(
            status_code=400,
            detail="You can only rate after a listing is marked as sold",
        )

    # 3. Can't rate your own listing
    if listing.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot rate your own listing"
        )

    # 4. One rating per listing per rater (the unique constraint will also
    #    catch this, but a friendly 409 beats a raw 500)
    existing = db.execute(
        select(Rating).where(
            Rating.listing_id == listing_id,
            Rating.rater_id == current_user.id
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409, detail="You have already rated this listing"
        )

    # 5. Ratee is always the listing owner (the seller)
    ratee_id = listing.user_id

    rating = Rating(
        listing_id=listing_id,
        rater_id=current_user.id,
        ratee_id=ratee_id,
        role=body.role,
        score=body.score,
        recommended=body.recommended
    )
    db.add(rating)
    db.flush()  # get the generated id before commit

    # 6. Update denormalized stats on the ratee
    _refresh_user_stats(db, ratee_id)

    db.refresh(rating)
    return RatingOut(
        id=str(rating.id),
        listing_id=str(rating.listing_id),
        rater_id=str(rating.rater_id),
        ratee_id=str(rating.ratee_id),
        role=rating.role,
        score=rating.score,
        recommended=rating.recommended,
        created_at=rating.created_at.isoformat(),
        rater_name=current_user.name
    )


# ── GET /users/{user_id}/ratings ─────────────────────────────────────────────

@router.get("/users/{user_id}/ratings", response_model=list[RatingOut])
def get_user_ratings(
    user_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Return all ratings received by a user, newest first."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    rows = db.execute(
        select(Rating, User.name.label("rater_name"))
        .join(User, User.id == Rating.rater_id)
        .where(Rating.ratee_id == user_id)
        .order_by(Rating.created_at.desc())
    ).all()

    return [
        RatingOut(
            id=str(r.Rating.id),
            listing_id=str(r.Rating.listing_id),
            rater_id=str(r.Rating.rater_id),
            ratee_id=str(r.Rating.ratee_id),
            role=r.Rating.role,
            score=r.Rating.score,
            recommended=r.Rating.recommended,
            created_at=r.Rating.created_at.isoformat(),
            rater_name=r.rater_name
        )
        for r in rows
    ]


# ── GET /users/{user_id}/ratings/summary ─────────────────────────────────────

@router.get("/users/{user_id}/ratings/summary", response_model=RatingSummary)
def get_user_ratings_summary(
    user_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    """Aggregate stats: average score, total count, recommend percentage."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = db.execute(
        select(
            func.count(Rating.id).label("total"),
            func.avg(Rating.score).label("avg_score"),
            func.sum(cast(Rating.recommended, Integer)).label("recommended_count"),
        ).where(Rating.ratee_id == user_id)
    ).one()

    # Avoid division by zero
    total = result.total or 0
    if total == 0:
        return RatingSummary(total=0, average_score=None, recommend_pct=None)

    recommend_pct = round((result.recommended_count or 0) / total * 100, 1)
    average_score = round(float(result.avg_score), 2) if result.avg_score else None

    return RatingSummary(
        total=total,
        average_score=average_score,
        recommend_pct=recommend_pct
    )