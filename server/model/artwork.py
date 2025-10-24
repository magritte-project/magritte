from sqlmodel import Field, Relationship

from model.base import LibraryModel
from schemas.artwork import ArtworkKind

from .song import Song, SongArtworkLink


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
    background_color: str | None = Field(
        default=None,
        description="The background color of the artwork",
    )
    primary_color: str | None = Field(
        default=None,
        description="The primary color of the artwork",
    )
    secondary_color: str | None = Field(
        default=None,
        description="The secondary color of the artwork",
    )
    tertiary_color: str | None = Field(
        default=None,
        description="The tertiary color of the artwork",
    )
    songs: list[Song] = Relationship(
        back_populates="artworks",
        link_model=SongArtworkLink,
    )
