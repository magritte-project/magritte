from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from magritte.auth import get_current_user
from magritte.db import get_db_session
from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.library import Library
from magritte.model.user import User
from magritte.schemas.album import AlbumQuery, AlbumRead, AlbumUpdate
from magritte.schemas.artwork import ArtworkRead
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.library import LibraryMediaRead

router = APIRouter()


@router.get(
    "/{library_id}/albums/{album_id}",
    response_model=AlbumRead,
    summary="Read an album",
)
async def read_library_album(
    library_id: int,
    album_id: int,
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

    album = await session.get(Album, album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Album not found"
        )

    return AlbumRead(
        **album.model_dump(),
        artworks=[
            ArtworkRead(**artwork.model_dump()) for artwork in await album.all_artworks
        ],
    )


@router.patch(
    "/{library_id}/albums/{album_id}",
    response_model=AlbumRead,
    summary="Update an album",
)
async def update_library_album(
    library_id: int,
    album_id: int,
    update_album: AlbumUpdate,
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

    album = await session.get(Album, album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Album not found"
        )

    changes = update_album.model_dump(
        exclude_unset=True,
        exclude={"artwork_ids"},
    )
    for name, value in changes.items():
        setattr(album, name, value)

    album.has_altered_metadata = True

    await session.flush()
    return AlbumRead(
        **album.model_dump(),
        artworks=[
            ArtworkRead(**artwork.model_dump()) for artwork in await album.all_artworks
        ],
    )


@router.delete(
    "/{library_id}/albums/{album_id}",
    summary="Delete an album",
)
async def delete_library_album(
    library_id: int,
    album_id: int,
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

    album = await session.get(Album, album_id)
    if not album:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Album not found"
        )

    await session.delete(album)
    await session.flush()


@router.get(
    "/{library_id}/albums",
    response_model=LibraryMediaRead[AlbumRead],
    summary="Read a page of albums in a library",
)
async def read_library_albums(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[AlbumQuery, Query()],
):
    if not await Library.can_user_access_by_id(library_id, current_user.id, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    where_criteria = list[ColumnExpressionArgument]()
    if query.artist_id is not None:
        where_criteria.append(col(Album.artist_id) == query.artist_id)
    if query.query is not None:
        where_criteria.append(Album.strs_ilike(query.query))

    total, albums = await Album.read_many_with_total(
        where=[
            col(Album.libraries).any(col(Library.id) == library_id),
            *where_criteria,
        ],
        joins=[
            (Artist, col(Album.artist_id) == Artist.id),
        ],
        order_by=[
            col(Album.title),
        ],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return LibraryMediaRead(
        items=[
            AlbumRead(
                **album.model_dump(),
                artworks=[
                    ArtworkRead(**artwork.model_dump())
                    for artwork in await album.all_artworks
                ],
            )
            for album in albums
        ],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )
