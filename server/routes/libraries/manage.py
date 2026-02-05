from pathlib import Path
from typing import Annotated

import sqlalchemy as sa
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Query,
    Security,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from auth import get_current_user
from config import config
from db import get_db_session
from model.library import Library
from model.user import User, UserLibraryLink
from schemas.auth import OAuth2Scope
from schemas.base import OperationResult
from schemas.library import (
    LibraryCreate,
    LibraryHomePathRead,
    LibraryPermissionCreate,
    LibraryPermissionRead,
    LibraryPermissionUpdate,
    LibraryRead,
    LibraryUpdate,
)
from worker import sync_library

router = APIRouter()


@router.get(
    "/",
    response_model=list[LibraryRead],
    summary="Read the libraries the signed in user has access to",
)
async def read_libraries(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    libraries = await Library.read_all(current_user.id, session)
    return [LibraryRead(**library.model_dump()) for library in libraries]


@router.get(
    "/home-subpaths",
    response_model=LibraryHomePathRead,
    summary="Read subpaths a library can be configured to use as a home",
)
async def read_library_home_subpaths(
    relative_to: Annotated[str, Query()],
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
):
    relative_to_path = Path(relative_to)
    if relative_to_path.is_absolute():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="relative_to not relative",
        )

    absolute_path = config.music_home_path.joinpath(relative_to_path)
    if absolute_path.is_symlink() or not absolute_path.is_dir():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="relative_to invalid",
        )

    subpaths = list[str]()
    for dir_entry in absolute_path.iterdir():
        if dir_entry.is_symlink() or not dir_entry.is_dir():
            continue
        subpaths.append(dir_entry.name)

    return LibraryHomePathRead(
        relative_to=relative_to_path.as_posix(),
        subpaths=subpaths,
    )


@router.post(
    "/create",
    response_model=LibraryRead,
    summary="Create an empty library owned by the signed in user",
)
async def create_library(
    library_create: LibraryCreate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    background_tasks: BackgroundTasks,
):
    new_library = Library(
        name=library_create.name,
        home_path=library_create.home_path,
    )
    session.add(new_library)
    await session.flush()  # for id

    session.add(
        UserLibraryLink(
            user_id=current_user.id,
            library_id=new_library.id,
            can_add=True,
            can_edit=True,
            can_remove=True,
        )
    )
    await session.flush()

    background_tasks.add_task(sync_library, new_library.id)

    return LibraryRead(**new_library.model_dump())


@router.patch(
    "/{library_id}",
    response_model=LibraryRead,
    summary="Update a library by its ID",
)
async def update_library(
    library_id: int,
    update_library: LibraryUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(
        library_id,
        current_user.id,
        session,
        can_edit=True,
    )
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    changes = update_library.model_dump(
        exclude_unset=True,
    )
    for name, value in changes.items():
        setattr(library, name, value)

    await session.flush()

    return LibraryRead(**library.model_dump())


@router.get(
    "/{library_id}",
    response_model=LibraryRead,
    summary="Read a library by its ID",
)
async def read_library(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(library_id, current_user.id, session)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )
    return LibraryRead(**library.model_dump())


@router.get(
    "/{library_id}/permissions",
    response_model=list[LibraryPermissionRead],
    summary="Read a library's permissions",
)
async def read_library_permissions(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_READ])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(
        library_id,
        current_user.id,
        session,
    )
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    permissions = await session.execute(
        sa.select(
            col(User.id).label("user_id"),
            col(User.username).label("username"),
            col(UserLibraryLink.can_add).label("can_add"),
            col(UserLibraryLink.can_edit).label("can_edit"),
            col(UserLibraryLink.can_remove).label("can_remove"),
        )
        .where(
            col(UserLibraryLink.library_id) == library_id,
        )
        .join(User, col(User.id) == col(UserLibraryLink.user_id))
    )
    return [
        LibraryPermissionRead(**permission) for permission in permissions.mappings()
    ]


@router.post(
    "/{library_id}/permission/create",
    response_model=LibraryPermissionRead,
    summary="Create library permission for a new user",
)
async def create_library_permission(
    library_id: int,
    create_permission: LibraryPermissionCreate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(
        library_id,
        current_user.id,
        session,
        can_edit=True,
    )
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    user = await session.get(User, create_permission.user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user_library_link = await session.scalar(
        select(UserLibraryLink).where(
            col(UserLibraryLink.library_id) == library_id,
            col(UserLibraryLink.user_id) == create_permission.user_id,
        )
    )
    if user_library_link:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Permission already exists"
        )

    user_library_link = UserLibraryLink(
        user_id=user.id,
        library_id=library_id,
        can_add=create_permission.can_add,
        can_edit=create_permission.can_edit,
        can_remove=create_permission.can_remove,
    )
    session.add(user_library_link)
    await session.flush()

    return LibraryPermissionRead(
        user_id=user.id,
        username=user.username,
        can_add=user_library_link.can_add,
        can_edit=user_library_link.can_edit,
        can_remove=user_library_link.can_remove,
    )


@router.patch(
    "/{library_id}/permission/{user_id}",
    response_model=LibraryPermissionRead,
    summary="Update library permission for one user",
)
async def update_library_permission(
    library_id: int,
    user_id: int,
    update_permission: LibraryPermissionUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(
        library_id,
        current_user.id,
        session,
        can_edit=True,
    )
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update yourself",
        )

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user_library_link = await session.scalar(
        select(UserLibraryLink).where(
            col(UserLibraryLink.library_id) == library_id,
            col(UserLibraryLink.user_id) == user_id,
        )
    )
    if not user_library_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )

    if update_permission.can_add is not None:
        user_library_link.can_add = update_permission.can_add
    if update_permission.can_edit is not None:
        user_library_link.can_edit = update_permission.can_edit
    if update_permission.can_remove is not None:
        user_library_link.can_remove = update_permission.can_remove

    await session.flush()

    return LibraryPermissionRead(
        user_id=user.id,
        username=user.username,
        can_add=user_library_link.can_add,
        can_edit=user_library_link.can_edit,
        can_remove=user_library_link.can_remove,
    )


@router.delete(
    "/{library_id}/permission/{user_id}",
    response_model=OperationResult,
    summary="Delete library permission for one user",
)
async def delete_library_permission(
    library_id: int,
    user_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(
        library_id,
        current_user.id,
        session,
        can_edit=True,
    )
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself",
        )

    user_library_link = await session.scalar(
        select(UserLibraryLink).where(
            col(UserLibraryLink.library_id) == library_id,
            col(UserLibraryLink.user_id) == user_id,
        )
    )
    if not user_library_link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Permission not found"
        )

    await session.delete(user_library_link)
    await session.flush()

    return OperationResult(
        message="Permission deleted",
        row_count=1,
    )
