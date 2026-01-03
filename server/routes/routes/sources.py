from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.responses import FileResponse
from fastapi.security import SecurityScopes
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from auth import get_current_user
from db import get_db_session
from model.source import Source
from model.user import User
from schemas.auth import OAuth2Scope
from schemas.source import SourceCreate, SourceRead, SourceUpdate

router = APIRouter(prefix="/sources")


@router.post(
    "/create",
    response_model=SourceRead,
    summary="Create a source",
)
async def create_source(
    create_source: SourceCreate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    source, inserted = await Source(
        url=create_source.url,
        mime_type=create_source.mime_type,
    ).try_insert_unique(
        col(Source.url) == create_source.url,
        session,
    )
    if not inserted:
        source.mime_type = create_source.mime_type
        source.is_invalid = False
    return SourceRead(**source.model_dump())


@router.patch(
    "/{source_id}",
    response_model=SourceRead,
    summary="Update a source",
)
async def update_source(
    source_id: int,
    update_source: SourceUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    source = await session.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )
    changes = update_source.model_dump(
        exclude_unset=True,
    )
    for name, value in changes.items():
        setattr(source, name, value)

    await session.flush()
    return SourceRead(**source.model_dump())


@router.delete(
    "/{source_id}",
    summary="Delete a source",
)
async def delete_source(
    source_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    source = await session.get(Source, source_id)
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    await session.delete(source)
    await session.flush()


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
