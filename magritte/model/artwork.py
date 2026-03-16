import hashlib
from collections.abc import Buffer

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, UniqueConstraint, col, delete

from magritte.model.base import LibraryModel
from magritte.schemas.artwork import ArtworkKind

from .song import Song, SongArtworkLink


class Artwork(LibraryModel, table=True):
    __tablename__: str = "artworks"
    __table_args__ = (UniqueConstraint("kind", "image_hash", name="unique_artwork"),)

    kind: ArtworkKind = Field(
        default=ArtworkKind.FRONT_COVER,
        description="What this artwork is",
    )
    image_hash: str = Field(
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

    @classmethod
    def create_image_hash(cls, data: Buffer):
        """
        Derive an image hash from the given data.

        :param data: Either the bitmap data of the image
        an artwork is representing, or a UTF-8 encoded URL
        string for images not managed by Magritte itself.
        :returns: A unique, reproducible hash for the artwork.
        """
        sha256 = hashlib.sha256()
        sha256.update(data)
        return sha256.hexdigest()

    @classmethod
    async def delete_orphans(cls, session: AsyncSession):
        """
        Delete any artworks not associated with a song.
        """
        await session.execute(
            delete(cls).where(
                ~col(cls.songs).any(),
            )
        )
