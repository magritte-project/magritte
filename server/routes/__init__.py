from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    authenticate_user,
    create_user,
)
from db import get_db_session
from schemas.users import Token, UserProfile, UserSignUp

from .libraries import router as libraries_router
from .users import router as users_router

router = APIRouter()
router.include_router(libraries_router)
router.include_router(users_router)


@router.get("/")
def read_root():
    return {
        "message": "hello, world",
    }


@router.post(
    "/sign-up",
    response_model=UserProfile,
    summary="Sign up a new user",
)
async def sign_up(
    sign_up: UserSignUp,
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        new_user = await create_user(
            sign_up.username,
            sign_up.password,
            session,
        )
        await session.flush()
        return UserProfile(**new_user.model_dump())
    except IntegrityError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        ) from e


@router.post(
    "/sign-in",
    response_model=Token,
    summary="Sign in as a user",
)
async def sign_in(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    new_access_token = await authenticate_user(
        form_data.username,
        form_data.password,
        session,
    )
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    return Token(
        access_token=new_access_token,
        token_type="bearer",
    )


__all__ = ["router"]
