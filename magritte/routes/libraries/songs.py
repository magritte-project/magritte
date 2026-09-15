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
from sqlmodel import col, select

from magritte.auth import get_current_user
from magritte.db import get_db_session
from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.artwork import Artwork
from magritte.model.library import Library
from magritte.model.song import Song, SongLibraryLink, SongSourceLink
from magritte.model.source import Source
from magritte.model.user import User
from magritte.schemas.artwork import ArtworkRead
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.library import LibraryMediaRead
from magritte.schemas.song import SongQuery, SongRead, SongUpdate
from magritte.schemas.source import SourceLookup, SourceLookupRead, SourceRead

router = APIRouter()


@router.post(
    "/{library_id}/songs/sources",
    response_model=SourceLookupRead,
    summary="Look up which source URLs belong to songs in a library",
)
async def lookup_library_song_sources(
    library_id: int,
    lookup: SourceLookup,
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

    if not lookup.urls:
        return SourceLookupRead(urls=[])

    urls = await session.scalars(
        select(Source.url)
        .distinct()
        .join(SongSourceLink, col(SongSourceLink.source_id) == col(Source.id))
        .join(
            SongLibraryLink,
            col(SongLibraryLink.song_id) == col(SongSourceLink.song_id),
        )
        .where(
            col(SongLibraryLink.library_id) == library_id,
            col(Source.url).in_(lookup.urls),
        )
    )
    return SourceLookupRead(urls=list(urls))


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

    song = await session.get(Song, song_id)
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

    song = await session.get(Song, song_id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )

    changes = update_song.model_dump(
        exclude_unset=True,
        exclude={"album_id", "artist_id", "artwork_ids", "source_ids"},
    )
    for name, value in changes.items():
        setattr(song, name, value)

    if "album_id" in update_song.model_fields_set:
        song.album = await Album.get_one_or_none(update_song.album_id, session)

    if "artist_id" in update_song.model_fields_set:
        song.artist = await Artist.get_one_or_none(update_song.artist_id, session)

    if update_song.artwork_ids:
        song.artworks = await Artwork.get_many(update_song.artwork_ids, session)

    if update_song.source_ids:
        song.sources = await Source.get_many(update_song.source_ids, session)

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
    session: Annotated[AsyncSession, Depends(get_db_session)],
    background_tasks: BackgroundTasks,
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

    song = await session.get(Song, song_id)
    if not song:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Song not found"
        )

    await session.delete(song)
    await session.flush()

    # TODO: Figure out why deleting things with unique constraints
    #       leaves behind ghost data which prevents entities from
    #       being re-created later.
    # background_tasks.add_task(garbage_collect, session)


@router.get(
    "/{library_id}/songs",
    response_model=LibraryMediaRead[SongRead],
    summary="Read a page of songs in a library",
)
async def read_library_songs(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
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
