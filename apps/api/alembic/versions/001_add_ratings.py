"""add ratings table and denormalized score columns on users

Revision ID: 001_add_ratings
Revises: 166d7c5261d2
Create Date: 2026-05-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# Revision identifiers
revision = "001_add_ratings"
down_revision = "166d7c5261d2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. ratings table ────────────────────────────────────────────────────
    op.create_table(
        "ratings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "listing_id",
            UUID(as_uuid=True),
            sa.ForeignKey("listings.id", ondelete="CASCADE"),
            nullable=False
        ),
        sa.Column(
            "rater_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False
        ),
        sa.Column(
            "ratee_id",
            UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False
        ),
        sa.Column("role", sa.String(10), nullable=False),
        sa.Column("score", sa.SmallInteger, nullable=False),
        sa.Column("recommended", sa.Boolean, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False
        ),
        # Constraints
        sa.UniqueConstraint("listing_id", "rater_id", name="uq_rating_listing_rater"),
        sa.CheckConstraint("rater_id != ratee_id", name="ck_rating_no_self_rate"),
        sa.CheckConstraint("score BETWEEN 1 AND 5", name="ck_rating_score_range")
    )

    # Indexes for common query patterns
    op.create_index("ix_ratings_listing_id", "ratings", ["listing_id"])
    op.create_index("ix_ratings_ratee_id", "ratings", ["ratee_id"])

    # ── 2. Denormalized rating columns on users ──────────────────────────────
    # Avoids an aggregate query every time a profile is loaded.
    # Updated by the POST /listings/{id}/rate endpoint after each new rating.
    op.add_column(
        "users",
        sa.Column("average_rating", sa.Numeric(3, 2), nullable=True)
    )
    op.add_column(
        "users",
        sa.Column("rating_count", sa.Integer, nullable=False, server_default="0")
    )


def downgrade() -> None:
    op.drop_column("users", "rating_count")
    op.drop_column("users", "average_rating")
    op.drop_index("ix_ratings_ratee_id", table_name="ratings")
    op.drop_index("ix_ratings_listing_id", table_name="ratings")
    op.drop_table("ratings")