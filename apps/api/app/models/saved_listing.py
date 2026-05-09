from sqlalchemy import DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
import uuid
from datetime import datetime

from app.db.base import Base


class SavedListing(Base):
    __tablename__ = "user_saved_listings"
 
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    listing_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("listings.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
 
    __table_args__ = (
        # One save per user per listing — prevents duplicates
        UniqueConstraint("user_id", "listing_id", name="uq_user_saved_listing"),
        {}  # SQLAlchemy requires a dict as the last element when using a tuple
    )