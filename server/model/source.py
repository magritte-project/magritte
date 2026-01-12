from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, col, delete, select, update

from model.base import LibraryModel
from model.song import Song, SongSourceLink
from utilities.files import path_as_file_uri


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
        link_model=SongSourceLink,
    )

    @classmethod
    async def delete_orphans(cls, session: AsyncSession):
        """
        Delete any sources not associated with a song.
        """
        await session.execute(
            delete(cls).where(
                ~col(cls.songs).any(),
            )
        )

    @classmethod
    async def read_one(cls, url: str, session: AsyncSession):
        """
        Read the existing source with the given URL.

        :param url: The URL of the source.
        :param session: The DB to read the source from.
        :returns: The existing source, if any.
        """
        return await session.scalar(
            select(cls).where(
                col(cls.url) == url,
            )
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
        file_url = path_as_file_uri(path)
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

    @classmethod
    async def move(
        cls,
        src_path: str,
        dest_path: str,
        session: AsyncSession,
        is_file: bool = True,
    ):
        src_url = path_as_file_uri(src_path)
        dest_url = path_as_file_uri(dest_path)
        if is_file:
            update_result = await session.execute(
                update(Source)
                .values(
                    url=dest_path,
                )
                .where(col(cls.url) == src_url)
            )
            return update_result.rowcount
        else:
            to_update = (
                await session.scalars(
                    select(cls).where(
                        col(cls.url).startswith(src_url),
                    )
                )
            ).all()

            for source in to_update:
                source.url = source.url.replace(src_url, dest_url, count=1)

            await session.flush()

            return len(to_update)
