"""
Notifications router
Endpoints:
  User-facing:
    GET    /notifications                     — flat notifications (newest first)
    PATCH  /notifications/read-all            — mark all flat notifications read
    PATCH  /notifications/{id}/read           — mark one flat notification read
    GET    /notifications/threads             — user's threads (newest first)
    GET    /notifications/threads/{id}        — full thread + messages
    POST   /notifications/threads/{id}/reply  — user replies (blocked if is_noreply)

  Admin-only:
    POST   /admin/notifications/broadcast               — flat notification to all or selected users
    POST   /admin/notifications/threads                 — start a two-way thread with a user
    POST   /admin/notifications/threads/{id}/reply      — admin replies in a thread
"""

import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.orm import Session, selectinload

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.notification import (
    Notification,
    NotificationMessage,
    NotificationThread,
    NotificationType,
)
from app.models.user import User

router = APIRouter(tags=["notifications"])


# ---------------------------------------------------------------------------
# Dependency helpers
# ---------------------------------------------------------------------------

def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require the current user to be an admin."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class NotificationOut(BaseModel):
    id: uuid.UUID
    type: NotificationType
    title: str
    body: str
    listing_id: Optional[uuid.UUID]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationMessageOut(BaseModel):
    id: uuid.UUID
    body: str
    sender_is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationThreadOut(BaseModel):
    id: uuid.UUID
    subject: str
    type: NotificationType
    is_noreply: bool
    user_has_unread: bool
    created_at: datetime
    updated_at: datetime
    messages: List[NotificationMessageOut] = []

    class Config:
        from_attributes = True


class NotificationThreadSummaryOut(BaseModel):
    """Thread list item — messages not included to keep payload small."""
    id: uuid.UUID
    subject: str
    type: NotificationType
    is_noreply: bool
    user_has_unread: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Admin request schemas
class BroadcastRequest(BaseModel):
    type: NotificationType
    title: str
    body: str
    user_ids: Optional[List[uuid.UUID]] = None  # None = send to all users
    listing_id: Optional[uuid.UUID] = None


class CreateThreadRequest(BaseModel):
    user_id: uuid.UUID
    subject: str
    type: NotificationType
    body: str                    # first message body
    is_noreply: bool = False


class ReplyRequest(BaseModel):
    body: str


# ---------------------------------------------------------------------------
# User-facing: flat notifications
# ---------------------------------------------------------------------------

@router.get("/notifications", response_model=List[NotificationOut])
def get_my_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's flat notifications, newest first."""
    rows = (
        db.execute(
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc())
        )
        .scalars()
        .all()
    )
    return rows


@router.patch("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark every unread flat notification as read for the current user."""
    db.execute(
        update(Notification)
        .where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
        .values(is_read=True)
    )
    db.commit()


@router.patch("/notifications/{notification_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_one_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a single flat notification as read."""
    notif = db.get(Notification, notification_id)
    if not notif or notif.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()


# ---------------------------------------------------------------------------
# User-facing: threads
# ---------------------------------------------------------------------------

@router.get("/notifications/threads", response_model=List[NotificationThreadSummaryOut])
def get_my_threads(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return the current user's threads, newest-updated first."""
    rows = (
        db.execute(
            select(NotificationThread)
            .where(NotificationThread.user_id == current_user.id)
            .order_by(NotificationThread.updated_at.desc())
        )
        .scalars()
        .all()
    )
    return rows


@router.get("/notifications/threads/{thread_id}", response_model=NotificationThreadOut)
def get_thread(
    thread_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return a full thread with all messages. Marks it as read for the user."""
    thread = db.execute(
        select(NotificationThread)
        .where(
            NotificationThread.id == thread_id,
            NotificationThread.user_id == current_user.id,
        )
        .options(selectinload(NotificationThread.messages))
    ).scalar_one_or_none()

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    # Mark as read when the user opens it
    if thread.user_has_unread:
        thread.user_has_unread = False
        db.commit()
        db.refresh(thread)

    return thread


@router.post(
    "/notifications/threads/{thread_id}/reply",
    response_model=NotificationMessageOut,
    status_code=status.HTTP_201_CREATED,
)
def user_reply(
    thread_id: uuid.UUID,
    payload: ReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """User replies to a thread. Blocked if the thread is marked is_noreply."""
    thread = db.execute(
        select(NotificationThread).where(
            NotificationThread.id == thread_id,
            NotificationThread.user_id == current_user.id,
        )
    ).scalar_one_or_none()

    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    if thread.is_noreply:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This conversation does not allow replies",
        )

    msg = NotificationMessage(
        thread_id=thread.id,
        body=payload.body,
        sender_is_admin=False,
    )
    db.add(msg)
    # Bump updated_at so the thread floats to the top of admin views
    thread.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return msg


# ---------------------------------------------------------------------------
# Admin: broadcast flat notification
# ---------------------------------------------------------------------------

@router.post(
    "/admin/notifications/broadcast",
    status_code=status.HTTP_201_CREATED,
)
def broadcast_notification(
    payload: BroadcastRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Send a flat notification to all users or a specific subset.
    Pass user_ids=null / omit to target every active user.
    """
    if payload.user_ids:
        target_ids = payload.user_ids
    else:
        # All active users
        target_ids = (
            db.execute(select(User.id).where(User.is_active == True))  # noqa: E712
            .scalars()
            .all()
        )

    notifications = [
        Notification(
            user_id=uid,
            type=payload.type,
            title=payload.title,
            body=payload.body,
            listing_id=payload.listing_id,
        )
        for uid in target_ids
    ]
    db.add_all(notifications)
    db.commit()

    return {"sent_to": len(notifications)}


# ---------------------------------------------------------------------------
# Admin: start a two-way thread
# ---------------------------------------------------------------------------

@router.post(
    "/admin/notifications/threads",
    response_model=NotificationThreadOut,
    status_code=status.HTTP_201_CREATED,
)
def create_thread(
    payload: CreateThreadRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin opens a new thread with a user and sends the first message."""
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    thread = NotificationThread(
        user_id=payload.user_id,
        subject=payload.subject,
        type=payload.type,
        is_noreply=payload.is_noreply,
        user_has_unread=True,
    )
    db.add(thread)
    db.flush()  # get thread.id before creating the message

    first_message = NotificationMessage(
        thread_id=thread.id,
        body=payload.body,
        sender_is_admin=True,
    )
    db.add(first_message)
    db.commit()
    db.refresh(thread)

    # Eagerly load messages for the response
    thread = db.execute(
        select(NotificationThread)
        .where(NotificationThread.id == thread.id)
        .options(selectinload(NotificationThread.messages))
    ).scalar_one()

    return thread


# ---------------------------------------------------------------------------
# Admin: reply inside an existing thread
# ---------------------------------------------------------------------------

@router.post(
    "/admin/notifications/threads/{thread_id}/reply",
    response_model=NotificationMessageOut,
    status_code=status.HTTP_201_CREATED,
)
def admin_reply(
    thread_id: uuid.UUID,
    payload: ReplyRequest,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Admin replies to an existing thread."""
    thread = db.get(NotificationThread, thread_id)
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")

    msg = NotificationMessage(
        thread_id=thread.id,
        body=payload.body,
        sender_is_admin=True,
    )
    db.add(msg)
    # Mark thread as unread for the user and bump updated_at
    thread.user_has_unread = True
    thread.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(msg)
    return msg


# ---------------------------------------------------------------------------
# Unread count — used by the navbar bell badge
# ---------------------------------------------------------------------------

class UnreadCountOut(BaseModel):
    unread_notifications: int
    unread_threads: int
    total: int


@router.get("/notifications/unread-count", response_model=UnreadCountOut)
def unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lightweight endpoint — call this to power the bell badge.
    Returns unread flat notifications + threads with unread messages.
    """
    from sqlalchemy import func as sqlfunc

    notif_count = db.execute(
        select(sqlfunc.count()).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False,  # noqa: E712
        )
    ).scalar_one()

    thread_count = db.execute(
        select(sqlfunc.count()).where(
            NotificationThread.user_id == current_user.id,
            NotificationThread.user_has_unread == True,  # noqa: E712
        )
    ).scalar_one()

    return {
        "unread_notifications": notif_count,
        "unread_threads": thread_count,
        "total": notif_count + thread_count,
    }