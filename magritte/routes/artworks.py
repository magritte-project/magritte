from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import and_, col, select

from magritte.auth import FeatureScope, get_current_user, get_feature_user
from magritte.config import config
from magritte.db import get_db_session
from magritte.model.access import artwork_accessible_by, artwork_libraries
from magritte.model.artwork import Artwork
from magritte.model.library import Library
from magritte.model.user import User
from magritte.schemas.artwork import ArtworkCreate, ArtworkRead, ArtworkUpdate
from magritte.schemas.auth import OAuth2Scope
from magritte.utilities.files import file_uri_as_contained_path, is_file_uri

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
    # Only update an existing artwork if every library using it permits the user to edit
    if not inserted and await Library.user_has_permission_on_all(
        await artwork_libraries(artwork, session),
        current_user.id,
        session,
        can_edit=True,
    ):
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
    if not artwork or not await Library.user_has_permission_on_all(
        await artwork_libraries(artwork, session),
        current_user.id,
        session,
        can_edit=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artwork not found",
        )

    if is_file_uri(artwork.image_url):
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
    if not artwork or not await Library.user_has_permission_on_all(
        await artwork_libraries(artwork, session),
        current_user.id,
        session,
        can_remove=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artwork not found",
        )

    if is_file_uri(artwork.image_url):
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
    current_user: Annotated[User, Depends(get_feature_user(FeatureScope.FILES_READ))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    artwork = await session.scalar(
        select(Artwork).where(
            col(Artwork.id) == artwork_id,
            artwork_accessible_by(current_user.id),
        )
    )
    if not artwork:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artwork not found"
        )

    if not is_file_uri(artwork.image_url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source is not a file",
        )

    # Only serve images from the artwork home, even if a stored URL points elsewhere
    image_path = file_uri_as_contained_path(
        artwork.image_url, [config.artwork_home_path]
    )
    if image_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artwork image not found"
        )

    return FileResponse(
        path=image_path,
        content_disposition_type="inline",
    )
