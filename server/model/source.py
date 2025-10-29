import pathlib

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, col, update

from model.base import LibraryModel
from model.song import Song, SourceArtworkLink


class Source(LibraryModel, table=True):
    __tablename__: str = "sources"

    url: str = Field(
        description="The location of this source",
        unique=True,
    )
    mime_type: str | None = Field(
        description="The mime type of this source",
    )
    is_invalid: bool = Field(
        default=False,
        description="Whether this source is known to be invalid",
    )
    songs: list[Song] = Relationship(
        back_populates="sources",
        link_model=SourceArtworkLink,
    )

    @classmethod
    async def mark_invalid(
        cls,
        path: str,
        session: AsyncSession,
        is_file: bool = True,
    ):
        """
        Mark sources matching the given path as being known invalid.

        :param path: The path to a library file.
        :param session: The DB to update the sources in.
        :param is_file: Whether the path refers to a file or a directory.
        """
        file_url = pathlib.Path(path).as_uri()
        if is_file:
            which_urls = col(cls.url) == file_url
        else:
            which_urls = col(cls.url).startswith(file_url)
        update_result = await session.execute(
            update(Source)
            .values(
                is_invalid=True,
            )
            .where(
                which_urls,
            )
        )
        return update_result.rowcount
