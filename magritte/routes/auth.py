from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from magritte.auth import (
    authenticate_user,
    create_user,
)
from magritte.config import config
from magritte.db import get_db_session
from magritte.model.user import User
from magritte.schemas.auth import InstanceStatusRead
from magritte.schemas.user import Token, UserProfileRead, UserSignUp

router = APIRouter()


@router.get(
    "/status",
    response_model=InstanceStatusRead,
    summary="Read the status of this instance",
)
async def read_instance_status(
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return InstanceStatusRead(
        env=config.env,
        first_setup_complete=await User.exists(
            where=[
                col(User.id) == 1,
            ],
            joins=[],
            session=session,
        ),
    )


@router.post(
    "/sign-up",
    response_model=UserProfileRead,
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
        return UserProfileRead(**new_user.model_dump())
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
    new_token = await authenticate_user(
        form_data.username,
        form_data.password,
        session,
    )
    if not new_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    return new_token
