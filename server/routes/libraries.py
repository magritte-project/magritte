from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, func, select

from auth import OAuth2Scope, get_current_user
from db import get_db_session
from model.album import Album
from model.artist import Artist
from model.library import Library
from model.song import Song
from model.user import User, UserLibraryLink
from schemas.libraries import LibraryCreate, LibraryMediaRead, LibraryRead
from schemas.songs import SongRead

router = APIRouter(prefix="/libraries")


@router.post(
    "/create",
    response_model=LibraryRead,
    summary="Create an empty library owned by the signed in user",
)
async def create_library(
    library_create: LibraryCreate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    new_library = Library(
        name=library_create.name,
    )
    session.add(new_library)
    await session.flush()  # for id

    session.add(
        UserLibraryLink(
            user_id=current_user.id,
            library_id=new_library.id,
            can_view=True,
            can_add=True,
            can_edit=True,
            can_remove=True,
        )
    )
    await session.flush()

    return LibraryRead(**new_library.model_dump())


@router.get(
    "/{library_id}",
    response_model=LibraryRead,
    summary="Read a library by its ID",
)
async def read_library(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(library_id, current_user.id, session)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )
    return LibraryRead(**library.model_dump())


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
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
):
    # TODO: Clean up everything about this...

    library = await Library.read_by_id(library_id, current_user.id, session)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    total = (
        await session.scalar(select(func.count(col(Song.id))).select_from(Song)) or 0
    )
    song_results = await session.execute(
        select(Song)
        .where(
            col(Song.libraries).any(col(Library.id) == library_id),
        )
        .join(Artist, col(Artist.id) == col(Song.artist_id))
        .join(Album, col(Album.id) == col(Song.album_id))
        .order_by(
            col(Artist.name),
            col(Album.title),
            col(Song.disc_number),
            col(Song.track_number),
        )
        .offset(offset)
        .limit(limit)
    )
    songs = song_results.unique().scalars()
    return LibraryMediaRead(
        items=[SongRead(**song.model_dump()) for song in songs],
        offset=offset,
        limit=limit,
        total=total,
    )
