from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, SQLModel, col, select

from model.base import LibraryModel

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

    @classmethod
    async def read_or_insert(cls, name: str, library: "Library", session: AsyncSession):
        existing_artist = await session.scalar(
            select(cls).where(
                col(cls.name) == name,
            )
        )
        if existing_artist:
            if not any(
                existing_library
                for existing_library in existing_artist.libraries
                if existing_library.id == library.id
            ):
                existing_artist.libraries.append(library)

            return existing_artist
        else:
            new_artist = cls(
                name=name,
                libraries=[library],
            )
            session.add(new_artist)
            await session.flush()
            return new_artist
