"""empty message

Revision ID: b1fa324e80eb
Revises: 420861887b1b
Create Date: 2026-04-29 10:43:46.180368

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b1fa324e80eb'
down_revision: Union[str, Sequence[str], None] = '420861887b1b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
