from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.responses import FileResponse
from fastapi.security import SecurityScopes
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import and_, col

from auth import get_current_user
from db import get_db_session
from model.artwork import Artwork
from model.user import User
from schemas.artwork import ArtworkCreate, ArtworkRead, ArtworkUpdate
from schemas.auth import OAuth2Scope

router = APIRouter(prefix="/artworks")


@router.post(
    "/create",
    response_model=ArtworkRead,
    summary="Create an artwork",
)
async def create_artwork(
    create_artwork: ArtworkCreate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    create_artwork_image_hash = Artwork.create_image_hash(
        create_artwork.image_url.encode("utf-8")
    )
    artwork, inserted = await Artwork(
        kind=create_artwork.kind,
        image_hash=create_artwork_image_hash,
        image_url=create_artwork.image_url,
        background_color=create_artwork.background_color,
        primary_color=create_artwork.primary_color,
        secondary_color=create_artwork.secondary_color,
        tertiary_color=create_artwork.tertiary_color,
    ).try_insert_unique(
        and_(
            col(Artwork.kind) == create_artwork.kind,
            col(Artwork.image_hash) == create_artwork_image_hash,
        ),
        session,
    )
    if not inserted:
        artwork.background_color = create_artwork.background_color
        artwork.primary_color = create_artwork.primary_color
        artwork.secondary_color = create_artwork.secondary_color
        artwork.tertiary_color = create_artwork.tertiary_color
    return ArtworkRead(**artwork.model_dump())


@router.patch(
    "/{artwork_id}",
    response_model=ArtworkRead,
    summary="Update an artwork",
)
async def update_artwork(
    artwork_id: int,
    update_artwork: ArtworkUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    artwork = await session.get(Artwork, artwork_id)
    if not artwork:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artwork not found",
        )

    if artwork.image_url.startswith("file"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artwork is managed",
        )

    changes = update_artwork.model_dump(
        exclude_unset=True,
        exclude={"image_url"},
    )
    for name, value in changes.items():
        setattr(artwork, name, value)

    if update_artwork.image_url is not None:
        artwork.image_hash = Artwork.create_image_hash(
            update_artwork.image_url.encode("utf-8")
        )
        artwork.image_url = update_artwork.image_url

    await session.flush()
    return ArtworkRead(**artwork.model_dump())


@router.delete(
    "/{artwork_id}",
    summary="Delete an artwork",
)
async def delete_artwork(
    artwork_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    artwork = await session.get(Artwork, artwork_id)
    if not artwork:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artwork not found",
        )

    if artwork.image_url.startswith("file"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Artwork is managed",
        )

    await session.delete(artwork)
    await session.flush()


@router.get(
    "/{artwork_id}/image",
    response_class=FileResponse,
    summary="Get the image of an artwork",
)
async def read_artwork_image(
    artwork_id: int,
    token: Annotated[
        str,
        Query(
            description="The token authenticating this artwork image read",
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    await get_current_user(
        security_scopes=SecurityScopes(scopes=[OAuth2Scope.LIBRARIES_READ]),
        token=token,
        session=session,
    )

    artwork = await session.get(Artwork, artwork_id)
    if not artwork:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found"
        )

    image_url = urlparse(artwork.image_url)
    if image_url.scheme != "file":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source is not a file",
        )
    image_path = unquote(image_url.path)

    return FileResponse(
        path=image_path,
        content_disposition_type="inline",
    )
