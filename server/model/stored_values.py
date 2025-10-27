from sqlmodel import Field

from model.base import LibraryModel


class StoredValue(LibraryModel, table=True):
    __tablename__: str = "stored_value"

    key: str = Field(
        unique=True,
        index=True,
        max_length=256,
        description="The lookup key",
    )

    value: str = Field(
        max_length=1024 * 1024,  # 1 MB
        description="The value",
    )
