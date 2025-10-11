from typing import TYPE_CHECKING, Union

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, col, select

from model.base import LibraryModel

if TYPE_CHECKING:
    from .artist import Artist
    from .song import Song


class Album(LibraryModel, table=True):
    __tablename__: str = "albums"

    title: str = Field(
        description="The title of the album",
        unique=True,
        index=True,
    )
    artist_id: int | None = Field(
        default=None,
        foreign_key="artists.id",
        description="ID of this album's artist",
    )
    artist: Union["Artist", None] = Relationship(back_populates="albums")
    songs: list["Song"] = Relationship(back_populates="album")

    @classmethod
    async def read_or_insert(cls, title: str, artist_id: int, session: AsyncSession):
        existing_album = await session.scalar(
            select(cls).where(col(cls.title) == title, col(cls.artist_id) == artist_id)
        )
        if existing_album:
            return existing_album
        else:
            new_album = cls(
                title=title,
                artist_id=artist_id,
            )
            session.add(new_album)
            await session.flush()
            return new_album
