from typing import Annotated

import httpx2
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col
from starlette import status
from starlette.background import BackgroundTasks

from magritte.auth import get_current_user
from magritte.db import get_db_session
from magritte.model.extension import Extension
from magritte.model.user import User, UserExtensionLink
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.base import OperationResult, PaginatedQuery
from magritte.schemas.extension import (
    ExtensionImportAdmin,
    ExtensionManifest,
    ExtensionRead,
)
from magritte.schemas.library import LibraryMediaRead
from magritte.utilities.user_events import (
    UserEvent,
    UserEvents,
    UserEventType,
    get_user_events,
)

router = APIRouter(prefix="/extensions")


@router.post(
    "/available/import",
    response_model=OperationResult,
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.ADMIN])],
    summary="Import an extension so it can be installed by users",
)
async def import_extension(
    import_extension: ExtensionImportAdmin,
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    # TODO: Figure out how to unit test this

    manifest_url_path = import_extension.manifest_url.path
    if manifest_url_path is None or not manifest_url_path.endswith(
        "/extension.magritte.json"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid manifest URL"
        )

    if await Extension.exists(
        where=[col(Extension.manifest_url) == str(import_extension.manifest_url)],
        joins=[],
        session=session,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Extension already imported",
        )

    async with httpx2.AsyncClient() as client:
        manifest = await ExtensionManifest.fetch_from(
            client, import_extension.manifest_url
        )

    await Extension.import_from(import_extension.manifest_url, manifest, session)

    return OperationResult(
        message="Extension imported successfully",
        row_count=1,
    )


@router.delete(
    "/available/{extension_id}",
    response_model=OperationResult,
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.ADMIN])],
    summary="Remove an extension for all users",
)
async def delete_extension(
    extension_id: int,
    background_tasks: BackgroundTasks,
    session: Annotated[AsyncSession, Depends(get_db_session, scope="function")],
    user_events: Annotated[UserEvents, Depends(get_user_events)],
):
    extension = await Extension.get_one_or_none(extension_id, session)
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Extension not found"
        )

    if affected_user_ids := {user.id for user in await extension.awaitable_attrs.users}:
        background_tasks.add_task(
            user_events.notify,
            affected_user_ids,
            UserEvent(event_type=UserEventType.EXTENSIONS_CHANGED, ids=[extension_id]),
        )

    await session.delete(extension)
    await session.flush()

    return OperationResult(
        message="Extension deleted successfully",
        row_count=1,
    )


@router.get(
    "/available",
    response_model=LibraryMediaRead[ExtensionRead],
    dependencies=[Security(get_current_user)],
    summary="Read extensions available on this instance",
)
async def read_available_extensions(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[PaginatedQuery, Query()],
):
    total, extensions = await Extension.read_many_with_total(
        where=[],
        joins=[],
        order_by=[
            col(Extension.manifest_name),
        ],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return LibraryMediaRead(
        items=[
            ExtensionRead(
                id=extension.id,
                manifest=ExtensionManifest(**extension.manifest),
            )
            for extension in extensions
        ],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )


@router.post(
    "/available/{extension_id}/install",
    response_model=OperationResult,
    summary="Install an extension from the available list for the current user",
)
async def install_extension(
    extension_id: int,
    current_user: Annotated[User, Security(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    extension = await Extension.get_one_or_none(extension_id, session)
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Extension not found"
        )

    users = await extension.awaitable_attrs.users
    if current_user in users:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User already installed this extension",
        )

    users.append(current_user)
    await session.flush()

    return OperationResult(
        message="Extension installed successfully",
        row_count=1,
    )


@router.delete(
    "/installed/{extension_id}",
    response_model=OperationResult,
    summary="Uninstall an extension from for the current user",
)
async def uninstall_extension(
    extension_id: int,
    current_user: Annotated[User, Security(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    extension = await Extension.get_one_or_none(extension_id, session)
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Extension not found"
        )

    users = await extension.awaitable_attrs.users
    if current_user not in users:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User has not installed this extension",
        )

    users.remove(current_user)
    await session.flush()

    return OperationResult(
        message="Extension uninstalled successfully",
        row_count=1,
    )


@router.get(
    "/installed",
    response_model=LibraryMediaRead[ExtensionRead],
    summary="Read the current user's installed extensions",
)
async def read_installed_extensions(
    current_user: Annotated[User, Security(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[PaginatedQuery, Query()],
):
    total, extensions = await Extension.read_many_with_total(
        where=[
            col(UserExtensionLink.user_id) == current_user.id,
        ],
        joins=[
            (
                UserExtensionLink,
                col(UserExtensionLink.extension_id) == col(Extension.id),
            )
        ],
        order_by=[
            col(Extension.manifest_name),
        ],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return LibraryMediaRead(
        items=[
            ExtensionRead(
                id=extension.id,
                manifest=ExtensionManifest(**extension.manifest),
            )
            for extension in extensions
        ],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )
