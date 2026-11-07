from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Security,
    status,
)
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from magritte.auth import get_current_user
from magritte.db import get_db_session
from magritte.model.access import (
    read_accessible_artworks,
    read_accessible_sources,
    read_album_in_library,
    read_artist_in_library,
    read_song_in_library,
)
from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.ignored_resource import IgnoredResource
from magritte.model.library import Library
from magritte.model.song import Song
from magritte.model.user import User
from magritte.schemas.artwork import ArtworkRead
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.library import LibraryMediaRead
from magritte.schemas.song import SongQuery, SongRead, SongUpdate
from magritte.schemas.source import SourceRead
from magritte.utilities.gc import garbage_collect

router = APIRouter()


@router.get(
    "/{library_id}/songs/{song_id}",
    response_model=SongRead,
    summary="Read a song",
)
async def read_library_song(
    library_id: int,
    song_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not await Library.can_user_access_by_id(
        library_id,
        current_user.id,
        session,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    song = await read_song_in_library(song_id, library_id, session)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )

    return SongRead(
        **song.model_dump(),
        artworks=[
            ArtworkRead(**artwork.model_dump())
            for artwork in await song.awaitable_attrs.artworks
        ],
        sources=[
            SourceRead(**source.model_dump())
            for source in await song.awaitable_attrs.sources
        ],
    )


@router.patch(
    "/{library_id}/songs/{song_id}",
    response_model=SongRead,
    summary="Update a song",
)
async def update_library_song(
    library_id: int,
    song_id: int,
    update_song: SongUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not await Library.can_user_access_by_id(
        library_id,
        current_user.id,
        session,
        can_edit=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    song = await read_song_in_library(song_id, library_id, session)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )

    # Songs can be shared between libraries, so editing one must be allowed in all of them
    if not await Library.user_has_permission_on_all(
        await song.awaitable_attrs.libraries,
        current_user.id,
        session,
        can_edit=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Song is shared with a library you cannot edit",
        )

    changes = update_song.model_dump(
        exclude_unset=True,
        exclude={"album_id", "artist_id", "artwork_ids", "source_ids"},
    )
    for name, value in changes.items():
        setattr(song, name, value)

    if "album_id" in update_song.model_fields_set:
        if update_song.album_id is None:
            song.album = None
        else:
            album = await read_album_in_library(
                update_song.album_id, library_id, session
            )
            if not album:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Album not found"
                )
            song.album = album

    if "artist_id" in update_song.model_fields_set:
        if update_song.artist_id is None:
            song.artist = None
        else:
            artist = await read_artist_in_library(
                update_song.artist_id, library_id, session
            )
            if not artist:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
                )
            song.artist = artist

    if update_song.artwork_ids:
        artworks = await read_accessible_artworks(
            update_song.artwork_ids, current_user.id, session
        )
        if artworks is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found"
            )
        song.artworks = artworks

    if update_song.source_ids:
        sources = await read_accessible_sources(
            update_song.source_ids, current_user.id, session
        )
        if sources is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
            )
        song.sources = sources

    song.has_altered_metadata = True

    await session.flush()
    return SongRead(
        **song.model_dump(),
        artworks=[
            ArtworkRead(**artwork.model_dump())
            for artwork in await song.awaitable_attrs.artworks
        ],
        sources=[
            SourceRead(**source.model_dump())
            for source in await song.awaitable_attrs.sources
        ],
    )


@router.delete(
    "/{library_id}/songs/{song_id}",
    summary="Delete a song",
)
async def delete_library_song(
    library_id: int,
    song_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session, scope="function")],
    background_tasks: BackgroundTasks,
    suppress_source_file: Annotated[bool, Query()] = False,
):
    if not await Library.can_user_access_by_id(
        library_id,
        current_user.id,
        session,
        can_remove=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    song = await read_song_in_library(song_id, library_id, session)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )

    # Deleting a song removes it from every library, so it must be allowed in all of them
    if not await Library.user_has_permission_on_all(
        await song.awaitable_attrs.libraries,
        current_user.id,
        session,
        can_remove=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Song is shared with a library you cannot remove from",
        )

    if suppress_source_file:
        library = await session.get_one(Library, library_id)
        for source in await song.awaitable_attrs.sources:
            ignored_resource, _ = await IgnoredResource(
                url=source.url,
            ).try_insert_unique(
                col(IgnoredResource.url) == source.url,
                session,
            )
            ignored_resource.libraries = Library.combine(
                [library], await ignored_resource.awaitable_attrs.libraries
            )

    await session.delete(song)
    await session.flush()

    background_tasks.add_task(garbage_collect, session)


@router.get(
    "/{library_id}/songs",
    response_model=LibraryMediaRead[SongRead],
    summary="Read a page of songs in a library",
)
async def read_library_songs(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[SongQuery, Query()],
):
    if not await Library.can_user_access_by_id(library_id, current_user.id, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    where_criteria = list[ColumnExpressionArgument]()
    if query.album_id is not None:
        where_criteria.append(col(Song.album_id) == query.album_id)
    if query.artist_id is not None:
        where_criteria.append(col(Song.artist_id) == query.artist_id)
    if query.query is not None:
        where_criteria.append(Song.strs_ilike(query.query))

    total, songs = await Song.read_many_with_total(
        where=[
            col(Song.libraries).any(col(Library.id) == library_id),
            *where_criteria,
        ],
        joins=[
            (Artist, col(Artist.id) == col(Song.artist_id)),
            (Album, col(Album.id) == col(Song.album_id)),
        ],
        order_by=[
            Song.order_for_sort_key(sort.key, sort.order) for sort in query.sort_by
        ],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return LibraryMediaRead(
        items=[
            SongRead(
                **song.model_dump(),
                artworks=[
                    ArtworkRead(**artwork.model_dump())
                    for artwork in await song.awaitable_attrs.artworks
                ],
                sources=[
                    SourceRead(**source.model_dump())
                    for source in await song.awaitable_attrs.sources
                ],
            )
            for song in songs
        ],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )
