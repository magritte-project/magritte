from typing import TYPE_CHECKING, override

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel, col, delete, select

from magritte.model.base import LibraryModel

if TYPE_CHECKING:
    from .album import Album
    from .library import Library
    from .song import Song


class ArtistLibraryLink(SQLModel, table=True):
    __tablename__: str = "artist_library_links"

    artist_id: int | None = Field(
        default=None,
        foreign_key="artists.id",
        primary_key=True,
    )
    library_id: int | None = Field(
        default=None,
        foreign_key="libraries.id",
        primary_key=True,
    )


class Artist(LibraryModel, table=True):
    __tablename__: str = "artists"

    name: str = Field(
        description="The name of the artist",
        unique=True,
        index=True,
    )
    albums: list["Album"] = Relationship(back_populates="artist")
    songs: list["Song"] = Relationship(back_populates="artist")
    libraries: list["Library"] = Relationship(
        back_populates="artists",
        link_model=ArtistLibraryLink,
    )

    @override
    @classmethod
    def query_str_fields(cls) -> list[Mapped[str] | Mapped[str | None]]:
        return [
            col(cls.name),
        ]

    @classmethod
    async def delete_orphans(cls, session: AsyncSession):
        """
        Delete any artists not associated with a song.
        """
        await session.execute(
            delete(cls).where(
                ~col(cls.songs).any(),
            )
        )

    @classmethod
    async def read_or_insert(
        cls, name: str | None, libraries: list["Library"], session: AsyncSession
    ):
        if not name:
            return None

        existing_artist = await session.scalar(
            select(cls).where(
                col(cls.name) == name,
            )
        )
        if existing_artist:
            existing_library_ids = {
                library.id
                for library in await existing_artist.awaitable_attrs.libraries
            }
            for library in libraries:
                if library.id not in existing_library_ids:
                    existing_artist.libraries.append(library)

            return existing_artist
        else:
            new_artist = cls(
                name=name,
                libraries=libraries,
            )
            session.add(new_artist)
            await session.flush()
            return new_artist
