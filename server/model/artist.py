from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, col, select

from model.base import LibraryModel

if TYPE_CHECKING:
    from .album import Album
    from .song import Song


class Artist(LibraryModel, table=True):
    __tablename__: str = "artists"

    name: str = Field(
        description="The name of the artist",
        unique=True,
        index=True,
    )
    albums: list["Album"] = Relationship(back_populates="artist")
    songs: list["Song"] = Relationship(back_populates="artist")

    @classmethod
    async def read_or_insert(cls, name: str, session: AsyncSession):
        existing_artist = await session.scalar(
            select(cls).where(
                col(cls.name) == name,
            )
        )
        if existing_artist:
            return existing_artist
        else:
            new_artist = cls(
                name=name,
            )
            session.add(new_artist)
            await session.flush()
            return new_artist
