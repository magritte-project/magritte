from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from auth import OAuth2Scope, get_current_user
from db import get_db_session
from model.album import Album
from model.artist import Artist
from model.library import Library
from model.song import Song
from model.user import User, UserLibraryLink
from schemas.albums import AlbumRead
from schemas.artists import ArtistRead
from schemas.artwork import ArtworkRead
from schemas.libraries import LibraryCreate, LibraryMediaRead, LibraryRead
from schemas.songs import SongRead
from schemas.sources import SourceRead

router = APIRouter(prefix="/libraries")


@router.get(
    "/",
    response_model=list[LibraryRead],
    summary="Read the libraries the signed in user has access to",
)
async def read_libraries(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    libraries = await Library.read_all(current_user.id, session, can_view=True)
    return [LibraryRead(**library.model_dump()) for library in libraries]


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
        order_by=[
            col(Artist.name),
            col(Album.title),
            col(Song.disc_number),
            col(Song.track_number),
        ],
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
