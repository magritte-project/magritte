from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Security, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from config import config
from db import get_db_session
from model.library import Library
from model.user import User, UserLibraryLink
from schemas.auth import OAuth2Scope
from schemas.library import LibraryCreate, LibraryHomePathRead, LibraryRead

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

    absolute_path = Path.from_uri(str(config.library_home)).joinpath(relative_to_path)
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

    return LibraryRead(**new_library.model_dump())


@router.get(
    "/{library_id}",
    response_model=LibraryRead,
    summary="Read a library by its ID",
)
async def read_library(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    library = await Library.read_by_id(library_id, current_user.id, session)
    if not library:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )
    return LibraryRead(**library.model_dump())
