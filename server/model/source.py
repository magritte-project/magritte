from sqlmodel import Field, Relationship

from model.base import LibraryModel
from model.song import Song, SourceArtworkLink


class Source(LibraryModel, table=True):
    __tablename__: str = "sources"

    url: str = Field(
        description="The location of this source",
    )
    mime_type: str | None = Field(
        description="The mime type of this source",
    )
    songs: list[Song] = Relationship(
        back_populates="sources",
        link_model=SourceArtworkLink,
    )
