from datetime import datetime
from sqlmodel import Field, SQLModel

import sqlalchemy as sa


class LibraryModel(SQLModel):
    """
    Base class for models in a library
    """

    id: int = Field(
        primary_key=True,
        default=None,
        description="The unique identifier of this model",
    )

    creation_date: datetime = Field(
        sa_type=sa.TIMESTAMP(timezone=True),
        nullable=False,
        sa_column_kwargs={
            "server_default": sa.text("CURRENT_TIMESTAMP"),
        },
        description="When this model was created",
    )

    last_updated: datetime = Field(
        sa_type=sa.TIMESTAMP(timezone=True),
        nullable=False,
        sa_column_kwargs={
            "server_default": sa.text("CURRENT_TIMESTAMP"),
            "server_onupdate": sa.text("CURRENT_TIMESTAMP"),
        },
        description="When this model was last updated",
    )
