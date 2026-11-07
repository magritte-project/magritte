"""
Criteria for checking whether a user may access media which is not
addressed through a specific library, such as sources and artworks.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import and_, col, or_, select

from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.artwork import Artwork
from magritte.model.library import Library
from magritte.model.song import Song
from magritte.model.source import Source


async def read_song_in_library(
    song_id: int, library_id: int, session: AsyncSession
) -> Song | None:
    """Read a song by its ID, provided it belongs to the given library."""
    return await session.scalar(
        select(Song).where(
            col(Song.id) == song_id,
            col(Song.libraries).any(col(Library.id) == library_id),
        )
    )


async def read_album_in_library(
    album_id: int, library_id: int, session: AsyncSession
) -> Album | None:
    """Read an album by its ID, provided it belongs to the given library."""
    return await session.scalar(
        select(Album).where(
            col(Album.id) == album_id,
            col(Album.libraries).any(col(Library.id) == library_id),
        )
    )


async def read_artist_in_library(
    artist_id: int, library_id: int, session: AsyncSession
) -> Artist | None:
    """Read an artist by its ID, provided it belongs to the given library."""
    return await session.scalar(
        select(Artist).where(
            col(Artist.id) == artist_id,
            col(Artist.libraries).any(col(Library.id) == library_id),
        )
    )


async def source_libraries(source: Source) -> list[Library]:
    """Collect every library a source appears in through its songs."""
    libraries = dict[int | None, Library]()
    for song in await source.awaitable_attrs.songs:
        for library in await song.awaitable_attrs.libraries:
            libraries[library.id] = library
    return list(libraries.values())


async def artwork_libraries(artwork: Artwork, session: AsyncSession) -> list[Library]:
    """
    Collect every library an artwork appears in, either
    through its songs or as the cover of the library.
    """
    libraries = dict[int | None, Library]()
    for song in await artwork.awaitable_attrs.songs:
        for library in await song.awaitable_attrs.libraries:
            libraries[library.id] = library
    for library in await session.scalars(
        select(Library).where(col(Library.cover_artwork_id) == artwork.id)
    ):
        libraries[library.id] = library
    return list(libraries.values())


async def read_accessible_sources(
    ids: Sequence[int], user_id: int, session: AsyncSession
) -> list[Source] | None:
    """
    Read sources by their IDs, provided the user can access each of them
    or they are not part of any song yet.

    :returns: The sources in the order requested, or `None` if any are inaccessible.
    """
    sources = {
        source.id: source
        for source in await session.scalars(
            select(Source).where(
                col(Source.id).in_(ids),
                source_accessible_by(user_id, include_orphans=True),
            )
        )
    }
    if any(id not in sources for id in ids):
        return None
    return [sources[id] for id in ids]


async def read_accessible_artworks(
    ids: Sequence[int], user_id: int, session: AsyncSession
) -> list[Artwork] | None:
    """
    Read artworks by their IDs, provided the user can access each of them
    or they are not part of any song or library cover yet.

    :returns: The artworks in the order requested, or `None` if any are inaccessible.
    """
    artworks = {
        artwork.id: artwork
        for artwork in await session.scalars(
            select(Artwork).where(
                col(Artwork.id).in_(ids),
                artwork_accessible_by(user_id, include_orphans=True),
            )
        )
    }
    if any(id not in artworks for id in ids):
        return None
    return [artworks[id] for id in ids]


def source_accessible_by(
    user_id: int,
    *,
    include_orphans: bool = False,
    can_add: bool | None = None,
    can_edit: bool | None = None,
    can_remove: bool | None = None,
) -> sa.ColumnElement[bool]:
    """
    Build criteria matching sources which belong to a song in one of the user's libraries.

    :param user_id: The user to check access for.
    :param include_orphans: Whether to also match sources which are not part of any song
    yet, such as one just created so it can be attached to a song.
    :returns: Criteria for use in a where clause.
    """
    library_ids = Library.ids_for_user(user_id, can_add, can_edit, can_remove)
    in_users_libraries = col(Source.songs).any(
        col(Song.libraries).any(col(Library.id).in_(library_ids))
    )
    if include_orphans:
        return or_(in_users_libraries, ~col(Source.songs).any())
    return in_users_libraries


def artwork_accessible_by(
    user_id: int,
    *,
    include_orphans: bool = False,
    can_add: bool | None = None,
    can_edit: bool | None = None,
    can_remove: bool | None = None,
) -> sa.ColumnElement[bool]:
    """
    Build criteria matching artworks which belong to a song in one of the user's
    libraries, or which are the cover of one of the user's libraries.

    :param user_id: The user to check access for.
    :param include_orphans: Whether to also match artworks which are not part of any
    song or library cover yet, such as one just created so it can be attached.
    :returns: Criteria for use in a where clause.
    """
    library_ids = Library.ids_for_user(user_id, can_add, can_edit, can_remove)
    in_users_libraries = or_(
        col(Artwork.songs).any(
            col(Song.libraries).any(col(Library.id).in_(library_ids))
        ),
        sa.exists(
            select(col(Library.id)).where(
                col(Library.cover_artwork_id) == col(Artwork.id),
                col(Library.id).in_(library_ids),
            )
        ),
    )
    if include_orphans:
        is_orphan = and_(
            ~col(Artwork.songs).any(),
            ~sa.exists(
                select(col(Library.id)).where(
                    col(Library.cover_artwork_id) == col(Artwork.id),
                )
            ),
        )
        return or_(in_users_libraries, is_orphan)
    return in_users_libraries
