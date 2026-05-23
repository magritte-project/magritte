from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col
from starlette import status

from magritte.auth import get_current_user
from magritte.db import get_db_session
from magritte.model.extension import Extension
from magritte.model.user import User, UserExtensionLink
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.base import OperationResult
from magritte.schemas.extension import ExtensionImportAdmin, ExtensionRead
from magritte.schemas.library import LibraryMediaRead
from magritte.schemas.sdk import ExtensionManifest

router = APIRouter(prefix="/extensions")


@router.post(
    "/available/import",
    response_model=OperationResult,
    dependencies=[
        Security(get_current_user, scopes=[OAuth2Scope.ADMIN]),
    ],
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

    async with httpx.AsyncClient() as client:
        response = await client.get(
            str(import_extension.manifest_url),
            headers={"Accept": "application/json"},
            follow_redirects=True,
        )

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Manifest could not be fetched",
        )

    manifest = ExtensionManifest.model_validate_json(response.text)

    if await Extension.exists(
        where=[col(Extension.manifest_id) == manifest.id],
        joins=[],
        session=session,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Extension already imported",
        )

    new_extension = Extension(
        manifest_id=manifest.id,
        manifest_url=str(import_extension.manifest_url),
        manifest_name=manifest.name,
        manifest=manifest.model_dump(
            mode="json",
            by_alias=True,
        ),
    )
    session.add(new_extension)
    await session.flush()

    return OperationResult(
        message="Extension imported successfully",
        row_count=1,
    )


@router.delete(
    "/available/{extension_id}",
    response_model=OperationResult,
    summary="Remove an extension for all users",
)
async def delete_extension(
    extension_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.ADMIN])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    extension = await Extension.get_one_or_none(extension_id, session)
    if not extension:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Extension not found"
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
    summary="Read extensions available on this instance",
)
async def read_available_extensions(
    current_user: Annotated[User, Security(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
):
    total, extensions = await Extension.read_many_with_total(
        where=[],
        joins=[],
        order_by=[
            col(Extension.manifest_name),
        ],
        offset=offset,
        limit=limit,
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
        offset=offset,
        limit=limit,
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
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
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
        offset=offset,
        limit=limit,
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
        offset=offset,
        limit=limit,
        total=total,
    )
