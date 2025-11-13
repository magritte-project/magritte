from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from auth import get_current_user
from db import get_db_session
from model.album import Album
from model.artist import Artist
from model.artwork import Artwork
from model.library import Library
from model.song import Song
from model.source import Source
from model.user import User
from schemas.artwork import ArtworkRead
from schemas.auth import OAuth2Scope
from schemas.base import SortOrder
from schemas.library import LibraryMediaRead
from schemas.song import SongCreate, SongRead, SongSort, SongSortKey, SongUpdate
from schemas.source import SourceRead

router = APIRouter()


@router.post(
    "/{library_id}/songs/create",
    response_model=SongRead,
    summary="Create a new song",
)
async def create_library_song(
    library_id: int,
    create_song: SongCreate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not await Library.can_user_access_by_id(
        library_id,
        current_user.id,
        session,
        can_add=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    new_song = Song(
        artist_id=create_song.artist_id,
        album_id=create_song.album_id,
        artworks=await Artwork.get_many(create_song.artwork_ids, session),
        sources=await Source.get_many(create_song.source_ids, session),
        start_time=create_song.start_time,
        end_time=create_song.end_time,
        title=create_song.title,
        album_artist=create_song.album_artist,
        composer=create_song.composer,
        genre=create_song.genre,
        release_date=create_song.release_date,
        track_number=create_song.track_number,
        track_total=create_song.track_total,
        disc_number=create_song.disc_number,
        disc_total=create_song.disc_total,
        lyrics=create_song.lyrics,
        rating=create_song.rating,
        bpm=create_song.bpm,
        comment=create_song.comment,
        grouping=create_song.grouping,
        mcn=create_song.mcn,
        isrc=create_song.isrc,
        music_brainz_release_id=create_song.music_brainz_release_id,
        music_brainz_recording_id=create_song.music_brainz_recording_id,
    )
    session.add(new_song)
    await session.flush()
    return SongRead(
        **new_song.model_dump(),
        artworks=[
            ArtworkRead(**artwork.model_dump())
            for artwork in await new_song.awaitable_attrs.artworks
        ],
        sources=[
            SourceRead(**source.model_dump())
            for source in await new_song.awaitable_attrs.sources
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
        exclude={"artwork_ids", "source_ids"},
    )
    for name, value in changes.items():
        setattr(song, name, value)

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
    album_id: Annotated[
        int | None,
        Query(
            description="ID of the album to filter the songs by",
        ),
    ] = None,
    artist_id: Annotated[
        int | None,
        Query(
            description="ID of the artist to filter the songs by",
        ),
    ] = None,
    sort_by: Annotated[list[SongSort], Query(description="How to sort the items")] = [
        SongSort(SongSortKey.ARTIST_NAME, SortOrder.ASCENDING),
        SongSort(SongSortKey.ALBUM_TITLE, SortOrder.ASCENDING),
        SongSort(SongSortKey.DISC_NUMBER, SortOrder.ASCENDING),
        SongSort(SongSortKey.TRACK_NUMBER, SortOrder.ASCENDING),
    ],
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
):
    if not await Library.can_user_access_by_id(library_id, current_user.id, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    where_criteria = list[ColumnExpressionArgument]()
    if album_id is not None:
        where_criteria.append(col(Song.album_id) == album_id)
    if artist_id is not None:
        where_criteria.append(col(Song.artist_id) == artist_id)

    total, songs = await Song.read_many_with_total(
        where=[
            col(Song.libraries).any(col(Library.id) == library_id),
            *where_criteria,
        ],
        joins=[
            (Artist, col(Artist.id) == col(Song.artist_id)),
            (Album, col(Album.id) == col(Song.album_id)),
        ],
        order_by=[Song.order_for_sort_key(sort.key, sort.order) for sort in sort_by],
        offset=offset,
        limit=limit,
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
        offset=offset,
        limit=limit,
        total=total,
    )
