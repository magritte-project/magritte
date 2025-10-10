from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Security, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from auth import (
    authenticate_user,
    create_access_token,
    get_current_user,
    get_password_hash,
)
from db import get_db_session
from model.user import User
from schemas.users import Token, UserProfile, UserSignUp

router = APIRouter(prefix="/users")


@router.post(
    "/sign-up",
    response_model=UserProfile,
)
async def sign_up(
    sign_up: UserSignUp,
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        new_user = User(
            username=sign_up.username,
            hashed_password=get_password_hash(sign_up.password),
        )
        session.add(new_user)
        await session.flush()
        return UserProfile(**new_user.model_dump())
    except IntegrityError as e:
        print(f"Something went wrong: {e}")
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )


@router.post(
    "/sign-in",
    response_model=Token,
)
async def sign_in(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    user = await authenticate_user(form_data.username, form_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    new_access_token = create_access_token(user.username, set())
    return Token(
        access_token=new_access_token,
        token_type="bearer",
    )


@router.get(
    "/me",
    response_model=UserProfile,
)
async def me(
    current_user: Annotated[User, Security(get_current_user, scopes=[])],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return UserProfile(**current_user.model_dump())
