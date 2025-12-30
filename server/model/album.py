from typing import TYPE_CHECKING, Iterable, Union

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint, col, select

from model.base import LibraryModel

if TYPE_CHECKING:
    from .artist import Artist
    from .artwork import Artwork
    from .library import Library
    from .song import Song


class AlbumLibraryLink(SQLModel, table=True):
    __tablename__: str = "album_library_links"

    album_id: int | None = Field(
        default=None,
        foreign_key="albums.id",
        primary_key=True,
    )
    library_id: int | None = Field(
        default=None,
        foreign_key="libraries.id",
        primary_key=True,
    )


class Album(LibraryModel, table=True):
    __tablename__: str = "albums"
    __table_args__ = (
        UniqueConstraint("title", "artist_id", name="unique_artist_album"),
    )

    title: str = Field(
        description="The title of the album",
        index=True,
    )
    artist_id: int | None = Field(
        default=None,
        foreign_key="artists.id",
        description="ID of this album's artist",
    )
    artist: Union["Artist", None] = Relationship(back_populates="albums")
    songs: list["Song"] = Relationship(back_populates="album")
    libraries: list["Library"] = Relationship(
        back_populates="albums",
        link_model=AlbumLibraryLink,
    )

    @property
    async def all_artworks(self) -> Iterable["Artwork"]:
        """
        Collects and returns all artworks from this album's songs. Not cached.
        """
        songs = await self.awaitable_attrs.songs
        all_artworks = dict[int, "Artwork"]()
        for song in songs:
            song_artworks = await song.awaitable_attrs.artworks
            for song_artwork in song_artworks:
                if song_artwork.id not in all_artworks:
                    all_artworks[song_artwork.id] = song_artwork
        return all_artworks.values()

    @classmethod
    async def read_or_insert(
        cls,
        title: str,
        artist_id: int,
        libraries: list["Library"],
        session: AsyncSession,
    ):
        existing_album = await session.scalar(
            select(cls).where(col(cls.title) == title, col(cls.artist_id) == artist_id)
        )
        if existing_album:
            existing_library_ids = {
                library.id for library in await existing_album.awaitable_attrs.libraries
            }
            for library in libraries:
                if library.id not in existing_library_ids:
                    existing_album.libraries.append(library)

            return existing_album
        else:
            new_album = cls(
                title=title,
                artist_id=artist_id,
                libraries=libraries,
            )
            session.add(new_album)
            await session.flush()
            return new_album
