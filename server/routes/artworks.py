from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth import OAuth2Scope, get_current_user
from db import get_db_session
from model.artwork import Artwork
from model.user import User

router = APIRouter(prefix="/artworks")


@router.get(
    "/{artwork_id}/image",
    response_class=FileResponse,
    summary="Get the image of an artwork",
)
async def read_artwork_image(
    artwork_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
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
