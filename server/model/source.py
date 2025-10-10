from sqlmodel import Field

from model.base import LibraryModel


class Source(LibraryModel, table=True):
    __tablename__: str = "sources"

    url: str = Field(
        description="The location of this source",
    )
