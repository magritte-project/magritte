from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from model.base import LibraryModel

if TYPE_CHECKING:
    from .album import Album
    from .song import Song


class Artist(LibraryModel, table=True):
    __tablename__: str = "artists"

    name: str = Field(
        description="The name of the artist",
    )
    albums: list["Album"] = Relationship(back_populates="artist")
    songs: list["Song"] = Relationship(back_populates="artist")
