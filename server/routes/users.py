from typing import Annotated

from fastapi import APIRouter, Depends, Security
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    get_current_user,
)
from db import get_db_session
from model.user import User
from schemas.auth import OAuth2Scope
from schemas.user import UserProfile, UserProfileUpdate

router = APIRouter(prefix="/users")


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Read the signed in user's profile",
)
async def read_me(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
):
    return UserProfile(**current_user.model_dump())


@router.post(
    "/me",
    response_model=UserProfile,
    summary="Update the signed in user's profile",
)
async def update_me(
    profile_update: UserProfileUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    updates = profile_update.model_dump(exclude_unset=True)
    for name, value in updates.items():
        setattr(current_user, name, value)

    await session.flush()

    return UserProfile(**current_user.model_dump())
