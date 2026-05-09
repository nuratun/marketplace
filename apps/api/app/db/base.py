from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

from app.models.user import User          # noqa: F401, E402
from app.models.listing import Listing    # noqa: F401, E402
from app.models.saved_listing import SavedListing  # noqa: F401, E402