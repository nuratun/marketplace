import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    SmallInteger,
    String,
    UniqueConstraint,
    Boolean,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Rating(Base):
    __tablename__ = "ratings"

    __table_args__ = (
        # One rating per rater per listing — no double submitting
        UniqueConstraint("listing_id", "rater_id", name="uq_rating_listing_rater"),
        # Can't rate yourself
        CheckConstraint("rater_id != ratee_id", name="ck_rating_no_self_rate"),
        # Score must be 1–5
        CheckConstraint("score BETWEEN 1 AND 5", name="ck_rating_score_range"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    rater_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    ratee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True  # used heavily in GET /users/{id}/ratings
    )
    # "buyer" or "seller" — the rater's role in the transaction
    role: Mapped[str] = mapped_column(String(10), nullable=False)
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    recommended: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships (lazy by default — only load when accessed)
    listing = relationship("Listing", foreign_keys=[listing_id])
    rater = relationship("User", foreign_keys=[rater_id])
    ratee = relationship("User", foreign_keys=[ratee_id])