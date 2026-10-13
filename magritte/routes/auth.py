import secrets
from datetime import UTC, datetime, timedelta
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
    password_hash,
    send_reset_password_email,
    send_verification_email,
)
from magritte.config import config, get_secrets_config
from magritte.db import get_db_session
from magritte.email import EmailClient, get_email_client
from magritte.model.user import User
from magritte.schemas.auth import (
    CompleteResetPassword,
    InstanceStatusRead,
    ResetPassword,
    SignUp,
    Token,
)
from magritte.schemas.base import OperationResult
from magritte.schemas.user import UserProfileMeRead

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
    sign_up: SignUp,
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


@router.post(
    "/reset-password",
    response_model=OperationResult,
    summary="Request an email to reset a user's password",
)
async def reset_password(
    reset_password: ResetPassword,
    background_tasks: BackgroundTasks,
    email_client: Annotated[EmailClient | None, Depends(get_email_client)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not email_client:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Not configured to support emails",
        )

    user = await User.read_by_email(reset_password.email, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if user.email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User has no email"
        )

    token = secrets.token_hex(32)
    user.hashed_reset_password_token = password_hash.hash(
        token, salt=get_secrets_config().salt
    )
    user.reset_password_token_created_at = datetime.now(UTC)

    await session.flush()

    background_tasks.add_task(
        send_reset_password_email,
        email_client,
        user_email=user.email,
        user_username=user.username,
        token=token,
    )

    return OperationResult(message="Reset password email sent")


@router.post(
    "/reset-password/complete",
    response_model=OperationResult,
    summary="Request an email to reset a user's password",
)
async def reset_password_complete(
    complete_reset_password: CompleteResetPassword,
    email_client: Annotated[EmailClient | None, Depends(get_email_client)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not email_client:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="Not configured to support emails",
        )

    user = await User.read_by_email(complete_reset_password.email, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if user.email is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User has no email"
        )

    if (
        user.hashed_reset_password_token is None
        or user.reset_password_token_created_at is None
        or datetime.now(UTC)
        > user.reset_password_token_created_at.replace(tzinfo=UTC)
        + timedelta(minutes=15)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token"
        )

    if user.hashed_reset_password_token is None or not password_hash.verify(
        complete_reset_password.token, user.hashed_reset_password_token
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token"
        )

    user.hashed_password = password_hash.hash(
        complete_reset_password.new_password,
        salt=get_secrets_config().salt,
    )
    user.hashed_reset_password_token = None
    user.reset_password_token_created_at = None

    await session.flush()

    return OperationResult(message="Password reset complete")
