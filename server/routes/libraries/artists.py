from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from auth import get_current_user
from db import get_db_session
from model.artist import Artist
from model.library import Library
from model.user import User
from schemas.artist import ArtistCreate, ArtistRead, ArtistUpdate
from schemas.auth import OAuth2Scope
from schemas.library import LibraryMediaRead

router = APIRouter()


@router.post(
    "/{library_id}/artists/create",
    response_model=ArtistRead,
    summary="Create a new artist",
)
async def create_library_artist(
    library_id: int,
    create_artist: ArtistCreate,
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

    new_artist = Artist(
        name=create_artist.name,
    )
    session.add(new_artist)
    await session.flush()
    return ArtistRead(
        **new_artist.model_dump(),
    )


@router.patch(
    "/{library_id}/artists/{artist_id}",
    response_model=ArtistRead,
    summary="Update an artist",
)
async def update_library_artist(
    library_id: int,
    artist_id: int,
    update_artist: ArtistUpdate,
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

    artist = await session.get(Artist, artist_id)
    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
        )

    changes = update_artist.model_dump(
        exclude_unset=True,
    )
    for name, value in changes.items():
        setattr(artist, name, value)

    await session.flush()
    return ArtistRead(
        **artist.model_dump(),
    )


@router.delete(
    "/{library_id}/artists/{artist_id}",
    summary="Delete an artist",
)
async def delete_library_artist(
    library_id: int,
    artist_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
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

    artist = await session.get(Artist, artist_id)
    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
        )

    await session.delete(artist)
    await session.flush()


@router.get(
    "/{library_id}/artists",
    response_model=LibraryMediaRead[ArtistRead],
    summary="Read a page of albums in a library",
)
async def read_library_artists(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
):
    if not await Library.can_user_access_by_id(library_id, current_user.id, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    total, artists = await Artist.read_many_with_total(
        where=[
            col(Artist.libraries).any(col(Library.id) == library_id),
        ],
        joins=[],
        order_by=[
            col(Artist.name),
        ],
        offset=offset,
        limit=limit,
        session=session,
    )
    return LibraryMediaRead(
        items=[
            ArtistRead(
                **artist.model_dump(),
            )
            for artist in artists
        ],
        offset=offset,
        limit=limit,
        total=total,
    )
