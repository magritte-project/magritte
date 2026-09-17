from typing import Annotated
from urllib.parse import unquote, urlparse

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.responses import FileResponse
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from magritte.auth import FeatureScope, get_current_user, get_feature_user
from magritte.db import get_db_session
from magritte.model import Library, Song
from magritte.model.source import Source
from magritte.model.user import User
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.library import LibraryMediaRead
from magritte.schemas.source import SourceCreate, SourceQuery, SourceRead, SourceUpdate

router = APIRouter(prefix="/sources")


@router.get(
    "/all",
    response_model=LibraryMediaRead[SourceRead],
    summary="Read a page of sources matching the query",
)
async def read_all_sources(
    query: Annotated[SourceQuery, Query()],
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    where_criteria = list[ColumnExpressionArgument]()
    if query.library_id is not None:
        if not await Library.can_user_access_by_id(
            query.library_id,
            current_user.id,
            session,
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
            )
        where_criteria.append(
            col(Source.songs).any(
                col(Song.libraries).any(col(Library.id) == query.library_id)
            )
        )
    if query.extension_manifest_id is not None:
        where_criteria.append(
            col(Source.extension_manifest_id) == query.extension_manifest_id
        )
    if query.extension_tags is not None:
        where_criteria.append(col(Source.extension_tag).in_(query.extension_tags))

    total, sources = await Source.read_many_with_total(
        where=where_criteria,
        joins=[],
        order_by=[col(Source.creation_date)],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return LibraryMediaRead(
        items=[SourceRead(**source.model_dump()) for source in sources],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )


@router.post(
    "/create",
    response_model=SourceRead,
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])],
    summary="Create a source",
)
async def create_source(
    create_source: SourceCreate,
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    source, inserted = await Source(
        url=create_source.url,
        mime_type=create_source.mime_type,
        extension_manifest_id=create_source.extension_manifest_id,
        extension_tag=create_source.extension_tag,
    ).try_insert_unique(
        col(Source.url) == create_source.url,
        session,
    )
    if not inserted:
        source.mime_type = create_source.mime_type
        source.is_invalid = False
        source.extension_manifest_id = create_source.extension_manifest_id
        source.extension_tag = create_source.extension_tag
    return SourceRead(**source.model_dump())


@router.patch(
    "/{source_id}",
    response_model=SourceRead,
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])],
    summary="Update a source",
)
async def update_source(
    source_id: int,
    update_source: SourceUpdate,
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
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])],
    summary="Delete a source",
)
async def delete_source(
    source_id: int,
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
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])],
    summary="Read a source",
)
async def read_source(
    source_id: int,
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
    dependencies=[
        Depends(get_feature_user(FeatureScope.FILES_READ)),
    ],
    summary="Stream the file of a source",
)
async def stream_source_file(
    source_id: int,
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
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
