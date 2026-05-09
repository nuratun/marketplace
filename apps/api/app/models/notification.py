"""
Notification models — three tables:

  notifications           — flat, one-way system/admin messages (no reply)
  notification_threads    — two-way admin ↔ user conversations
  notification_messages   — individual messages inside a thread
"""

import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class NotificationType(str, enum.Enum):
    # Admin-initiated
    ADMIN_BROADCAST = "ADMIN_BROADCAST"       # one-way, sent to all or selected users
    ADMIN_MESSAGE = "ADMIN_MESSAGE"           # starts a two-way thread

    # Listing lifecycle
    LISTING_EXPIRING_SOON = "LISTING_EXPIRING_SOON"
    LISTING_EXPIRED = "LISTING_EXPIRED"
    LISTING_REMOVED = "LISTING_REMOVED"
    LISTING_PHONE_REVEALED = "LISTING_PHONE_REVEALED"

    # Account
    WELCOME = "WELCOME"
    ACCOUNT_WARNING = "ACCOUNT_WARNING"
    ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED"
    ACCOUNT_REINSTATED = "ACCOUNT_REINSTATED"

    # Saved listing activity
    SAVED_PRICE_DROP = "SAVED_PRICE_DROP"
    SAVED_LISTING_SOLD = "SAVED_LISTING_SOLD"
    SAVED_LISTING_REMOVED = "SAVED_LISTING_REMOVED"

    # Social (phase 2)
    RATING_RECEIVED = "RATING_RECEIVED"


class Notification(Base):
    """
    Flat, one-way notification.
    Used for system events and admin broadcasts/noreply messages.
    For two-way admin ↔ user conversations use NotificationThread.
    """
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notificationtype"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)

    # Optional FK — set when the notification relates to a specific listing
    listing_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("listings.id", ondelete="SET NULL"),
        nullable=True,
    )

    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships (no back_populates needed — we won't traverse from User to Notification)
    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])  # type: ignore[name-defined]


class NotificationThread(Base):
    """
    A two-way conversation between an admin and a user.
    Created by an admin via POST /admin/notifications/threads.
    """
    __tablename__ = "notification_threads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    subject: Mapped[str] = mapped_column(String(300), nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType, name="notificationtype"),
        nullable=False,
    )

    # When True, the user cannot reply — used for informational threads
    # that admins open as threads rather than flat notifications (rare, but supported)
    is_noreply: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Unread tracking for the user side
    user_has_unread: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])  # type: ignore[name-defined]
    messages: Mapped[list["NotificationMessage"]] = relationship(
        "NotificationMessage", back_populates="thread", order_by="NotificationMessage.created_at"
    )


class NotificationMessage(Base):
    """
    A single message inside a NotificationThread.
    sender_is_admin=True  → written by an admin
    sender_is_admin=False → written by the user
    """
    __tablename__ = "notification_messages"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    thread_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("notification_threads.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    sender_is_admin: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    thread: Mapped["NotificationThread"] = relationship(
        "NotificationThread", back_populates="messages"
    )