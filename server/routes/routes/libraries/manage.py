from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security, status
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from db import get_db_session
from model.library import Library
from model.user import User, UserLibraryLink
from schemas.auth import OAuth2Scope
from schemas.library import LibraryCreate, LibraryRead

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
