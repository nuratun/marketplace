from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '1.1'
down_revision = 'your_revision_id'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.create_table(
        'listings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('title', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('price', sa.Numeric(12, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=False, server_default='USD'),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('condition', sa.String(10), nullable=False),
        sa.Column('city', sa.String(50), nullable=False),
        sa.Column('status', sa.String(10), nullable=False, server_default='active'),
        sa.Column('attrs', JSONB, nullable=True),
        sa.Column('image_urls', JSONB, nullable=True),
        sa.Column('views', sa.Integer, server_default='0'),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_listings_category', 'listings', ['category'])
    op.create_index('ix_listings_city', 'listings', ['city'])
    op.create_index('ix_listings_status', 'listings', ['status'])
    op.create_index('ix_listings_user_id', 'listings', ['user_id'])
    op.create_index('ix_listings_created_at', 'listings', ['created_at'])

def downgrade() -> None:
    op.drop_index('ix_listings_created_at', table_name='listings')
    op.drop_index('ix_listings_user_id', table_name='listings')
    op.drop_index('ix_listings_status', table_name='listings')
    op.drop_index('ix_listings_city', table_name='listings')
    op.drop_index('ix_listings_category', table_name='listings')
    op.drop_table('listings')