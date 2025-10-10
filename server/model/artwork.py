from enum import Enum

from sqlmodel import Field, Relationship

from model.base import LibraryModel

from .song import Song, SongArtworkLink


class ArtworkKind(str, Enum):
    FRONT_COVER = "front_cover"


class Artwork(LibraryModel, table=True):
    __tablename__: str = "artworks"

    kind: ArtworkKind = Field(
        default=ArtworkKind.FRONT_COVER,
        description="What this artwork is",
    )
    image_hash: str = Field(
        unique=True,
        index=True,
        description="The digest hash of this artwork's image",
    )
    image_url: str = Field(
        description="The location of this artwork's image",
    )
    songs: list[Song] = Relationship(
        back_populates="artworks",
        link_model=SongArtworkLink,
    )
