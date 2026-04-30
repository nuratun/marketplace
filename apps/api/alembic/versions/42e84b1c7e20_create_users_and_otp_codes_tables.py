from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
import uuid

revision = '1.1' 
down_revision = 'your_revision_id'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('profile_pic', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('user_type', sa.String(), default="regular"),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_users_phone', 'users', ['phone'], unique=True)

    op.create_table(
        'otp_codes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        sa.Column('phone', sa.String(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('used', sa.Boolean(), default=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_otp_codes_phone', 'otp_codes', ['phone'], unique=False)

def downgrade() -> None:
    op.drop_index('ix_otp_codes_phone', table_name='otp_codes')
    op.drop_table('otp_codes')
    op.drop_index('ix_users_phone', table_name='users')
    op.drop_table('users')