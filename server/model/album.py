from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship

from model.base import LibraryModel

if TYPE_CHECKING:
    from .artist import Artist
    from .song import Song


class Album(LibraryModel, table=True):
    __tablename__: str = "albums"

    title: str = Field(
        description="The title of the album",
    )
    artist_id: int | None = Field(
        default=None,
        foreign_key="artists.id",
        description="ID of this album's artist",
    )
    artist: "Artist | None" = Relationship(back_populates="albums")
    songs: list["Song"] = Relationship(back_populates="album")
