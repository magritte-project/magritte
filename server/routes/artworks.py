from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from fastapi.security import SecurityScopes
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db import get_db_session
from model.artwork import Artwork
from schemas.auth import OAuth2Scope

router = APIRouter(prefix="/artworks")


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
