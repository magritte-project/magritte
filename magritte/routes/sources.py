from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from fastapi.responses import FileResponse
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import and_, col, select

from magritte.auth import FeatureScope, get_current_user, get_feature_user
from magritte.config import config
from magritte.db import get_db_session
from magritte.model import Library, Song
from magritte.model.access import source_accessible_by, source_libraries
from magritte.model.source import Source
from magritte.model.user import User
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.library import LibraryMediaRead
from magritte.schemas.source import (
    SourceChangesQuery,
    SourceChangesRead,
    SourceCreate,
    SourceQuery,
    SourceRead,
    SourceUpdate,
)
from magritte.utilities.files import file_uri_as_contained_path, is_file_uri

router = APIRouter(prefix="/sources")


@router.get(
    "/all",
    response_model=LibraryMediaRead[SourceRead],
    summary="Read a page of sources matching the query",
)
async def read_all_sources(
    query: Annotated[SourceQuery, Query()],
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
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
    else:
        where_criteria.append(
            source_accessible_by(current_user.id, include_orphans=True)
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
        extension_manifest_id=create_source.extension_manifest_id,
        extension_tag=create_source.extension_tag,
    ).try_insert_unique(
        col(Source.url) == create_source.url,
        session,
    )
    # Only update an existing source if every library using it permits the user to edit
    if not inserted and await Library.user_has_permission_on_all(
        await source_libraries(source),
        current_user.id,
        session,
        can_edit=True,
    ):
        source.mime_type = create_source.mime_type
        source.is_invalid = False
        source.extension_manifest_id = create_source.extension_manifest_id
        source.extension_tag = create_source.extension_tag
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
    if not source or not await Library.user_has_permission_on_all(
        await source_libraries(source),
        current_user.id,
        session,
        can_edit=True,
    ):
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
    if not source or not await Library.user_has_permission_on_all(
        await source_libraries(source),
        current_user.id,
        session,
        can_remove=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    await session.delete(source)
    await session.flush()


@router.get(
    "/changes",
    response_model=SourceChangesRead,
    summary="Read changes made to sources for syncing",
)
async def read_source_changes(
    query: Annotated[SourceChangesQuery, Query()],
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    where_criteria = list[ColumnExpressionArgument]()
    where_criteria.append(
        and_(
            col(Source.file_last_modified).is_not(None),
            col(Source.file_last_modified) >= query.since,
        )
    )
    if query.ids:
        where_criteria.append(col(Source.id).in_(query.ids))

    libraries = await Library.read_all(current_user.id, session)
    where_criteria.append(
        col(Source.songs).any(
            col(Song.libraries).any(
                col(Library.id).in_(library.id for library in libraries)
            )
        )
    )

    ids = await session.scalars(
        select(col(Source.id))
        .where(*where_criteria)
        .order_by(col(Source.last_updated).desc())
    )

    return SourceChangesRead(
        since=query.since,
        ids=ids,
    )


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
    source = await session.scalar(
        select(Source).where(
            col(Source.id) == source_id,
            source_accessible_by(current_user.id, include_orphans=True),
        )
    )
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
    current_user: Annotated[User, Depends(get_feature_user(FeatureScope.FILES_READ))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    source = await session.scalar(
        select(Source).where(
            col(Source.id) == source_id,
            source_accessible_by(current_user.id),
        )
    )
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
        )

    if not is_file_uri(source.url):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source is not a file",
        )

    # Only serve files from the music home, even if a stored URL points elsewhere
    source_file_path = file_uri_as_contained_path(source.url, [config.music_home_path])
    if source_file_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Source file not found"
        )

    return FileResponse(
        path=source_file_path,
        media_type=source.mime_type,
        content_disposition_type="inline",
    )
