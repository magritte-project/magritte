from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from auth import get_current_user
from db import get_db_session
from model.album import Album
from model.artwork import Artwork
from model.library import Library
from model.user import User
from schemas.album import AlbumCreate, AlbumRead, AlbumUpdate
from schemas.artwork import ArtworkRead
from schemas.auth import OAuth2Scope
from schemas.library import LibraryMediaRead

router = APIRouter()


@router.post(
    "/{library_id}/albums/create",
    response_model=AlbumRead,
    summary="Create a new album",
)
async def create_library_album(
    library_id: int,
    create_album: AlbumCreate,
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

    new_album = Album(
        title=create_album.title,
        artist_id=create_album.artist_id,
        artworks=await Artwork.get_many(create_album.artwork_ids, session),
    )
    session.add(new_album)
    await session.flush()
    return AlbumRead(
        **new_album.model_dump(),
        artworks=[
            ArtworkRead(**artwork.model_dump())
            for artwork in await new_album.all_artworks
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

    if update_album.artwork_ids:
        album.artworks = await Artwork.get_many(update_album.artwork_ids, session)

    await session.flush()
    return AlbumRead(
        **album.model_dump(),
        artworks=[
            ArtworkRead(**artwork.model_dump()) for artwork in await album.all_artworks
        ],
    )


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
    artist_id: Annotated[
        int | None,
        Query(
            description="ID of the artist to filter the songs by",
        ),
    ] = None,
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
):
    if not await Library.can_user_access_by_id(library_id, current_user.id, session):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    where_criteria = list[ColumnExpressionArgument]()
    if artist_id is not None:
        where_criteria.append(col(Album.artist_id) == artist_id)

    total, albums = await Album.read_many_with_total(
        where=[
            col(Album.libraries).any(col(Library.id) == library_id),
            *where_criteria,
        ],
        joins=[],
        order_by=[
            col(Album.title),
        ],
        offset=offset,
        limit=limit,
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
        offset=offset,
        limit=limit,
        total=total,
    )
