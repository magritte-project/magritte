from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.responses import FileResponse
from fastapi.security import SecurityScopes
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db import get_db_session
from model.source import Source
from model.user import User
from schemas.auth import OAuth2Scope
from schemas.source import SourceRead

router = APIRouter(prefix="/sources")


@router.get(
    "/{source_id}",
    response_model=SourceRead,
    summary="Read a source",
)
async def read_source(
    source_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    source = await session.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    return SourceRead(**source.model_dump())


@router.get(
    "/{source_id}/file",
    response_class=FileResponse,
    summary="Stream the file of a source",
)
async def stream_source_file(
    source_id: int,
    token: Annotated[
        str,
        Query(
            description="The token authenticating this source stream",
        ),
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    await get_current_user(
        security_scopes=SecurityScopes(scopes=[OAuth2Scope.LIBRARIES_READ]),
        token=token,
        session=session,
    )

    source = await session.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    source_url = urlparse(source.url)
    if source_url.scheme != "file":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source is not a file",
        )
    source_file_path = unquote(source_url.path)

    return FileResponse(
        path=source_file_path,
        media_type=source.mime_type,
        content_disposition_type="inline",
    )
