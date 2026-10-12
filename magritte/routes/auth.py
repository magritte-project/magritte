from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from magritte.auth import (
    FeatureScope,
    authenticate_user,
    create_user,
    get_feature_user,
    send_verification_email,
)
from magritte.config import config
from magritte.db import get_db_session
from magritte.email import EmailClient, get_email_client
from magritte.model.user import User
from magritte.schemas.auth import InstanceStatusRead
from magritte.schemas.base import OperationResult
from magritte.schemas.user import Token, UserProfileMeRead, UserSignUp

router = APIRouter()


@router.get(
    "/status",
    response_model=InstanceStatusRead,
    summary="Read the status of this instance",
)
async def read_instance_status(
    email_client: Annotated[EmailClient | None, Depends(get_email_client)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return InstanceStatusRead(
        env=config.env,
        uploads_enabled=config.enable_uploads,
        email_enabled=email_client is not None,
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
    response_model=UserProfileMeRead,
    summary="Sign up a new user",
)
async def sign_up(
    sign_up: UserSignUp,
    background_tasks: BackgroundTasks,
    email_client: Annotated[EmailClient | None, Depends(get_email_client)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        new_user = await create_user(
            sign_up.username,
            sign_up.password,
            session,
        )

        if email_client is not None:
            if not sign_up.email:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                    detail="Email required",
                )

            email_already_used = await User.exists(
                where=[
                    col(User.email) == sign_up.email,
                ],
                joins=[],
                session=session,
            )
            if email_already_used:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT, detail="Email already in use"
                )

            new_user.email = sign_up.email
            new_user.is_email_verified = False
            background_tasks.add_task(
                send_verification_email,
                email_client,
                user_email=new_user.email,
                user_username=new_user.username,
            )

        await session.flush()
        return UserProfileMeRead(**new_user.model_dump())
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
    email_client: Annotated[EmailClient | None, Depends(get_email_client)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    new_token = await authenticate_user(
        form_data.username,
        form_data.password,
        session,
        accept_email=email_client is not None,
    )
    if not new_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    return new_token


@router.post(
    "/verify-email",
    response_model=OperationResult,
    summary="Verify a user's email",
)
async def verify_email(
    current_user: Annotated[
        User, Depends(get_feature_user(FeatureScope.USER_VERIFY_EMAIL))
    ],
    email_client: Annotated[EmailClient | None, Depends(get_email_client)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not email_client:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Not configured to support emails",
        )

    if current_user.email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User has no email"
        )

    if current_user.is_email_verified is True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified"
        )

    current_user.is_email_verified = True
    await session.flush()

    return OperationResult(message="Email verified")
