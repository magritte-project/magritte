from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db_session
from model.artwork import Artwork

router = APIRouter(prefix="/artworks")


@router.get(
    "/{artwork_id}/image",
    response_class=FileResponse,
    summary="Get the image of an artwork",
)
async def read_artwork_image(
    artwork_id: int,
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
