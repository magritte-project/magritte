from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from magritte.auth import get_current_user
from magritte.db import get_db_session
from magritte.model.artist import Artist
from magritte.model.library import Library
from magritte.model.user import User
from magritte.schemas.artist import ArtistQuery, ArtistRead, ArtistUpdate
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.library import LibraryMediaRead

router = APIRouter()


@router.get(
    "/{library_id}/artists/{artist_id}",
    response_model=ArtistRead,
    summary="Read an artist",
)
async def read_library_artist(
    library_id: int,
    artist_id: int,
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

    artist = await session.get(Artist, artist_id)
    if not artist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
        )

    return ArtistRead(
        **artist.model_dump(),
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
    query: Annotated[ArtistQuery, Query()],
):
    if not await Library.can_user_access_by_id(library_id, current_user.id, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    where_criteria = list[ColumnExpressionArgument]()
    if query.query is not None:
        where_criteria.append(Artist.strs_ilike(query.query))

    total, artists = await Artist.read_many_with_total(
        where=[
            col(Artist.libraries).any(col(Library.id) == library_id),
            *where_criteria,
        ],
        joins=[],
        order_by=[
            col(Artist.name),
        ],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return LibraryMediaRead(
        items=[
            ArtistRead(
                **artist.model_dump(),
            )
            for artist in artists
        ],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )
