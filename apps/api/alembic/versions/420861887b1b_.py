"""empty message

Revision ID: 420861887b1b
Revises: b2c6114c827f
Create Date: 2026-04-29 10:41:12.145263

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '420861887b1b'
down_revision: Union[str, Sequence[str], None] = 'b2c6114c827f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
