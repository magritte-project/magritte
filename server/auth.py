from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from pwdlib import PasswordHash
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from config import ALGORITHM, SECRET
from db import get_db_session
from model.user import Scope, User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/users/sign-in",
    scopes={Scope.ME: "Access the user's own profile"},
)

password_hash = PasswordHash.recommended()


def create_access_token(
    username: str,
    scopes: set[Scope],
    expires: timedelta | None = timedelta(weeks=4),
):
    to_encode: dict[str, Any] = {
        "sub": username,
        "scope": " ".join(scopes),
    }
    if expires:
        to_encode["exp"] = datetime.now(UTC) + expires
    return jwt.encode(to_encode, SECRET, ALGORITHM)


def verify_password(plain_password: str, hashed_password: str):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str):
    return password_hash.hash(password)


async def get_user(
    username: str,
    session: AsyncSession,
):
    return await session.scalar(
        select(User).where(
            col(User.username) == username,
        ),
    )


async def authenticate_user(
    username: str,
    password: str,
    session: AsyncSession,
):
    user = await get_user(username, session)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def get_current_user(
    security_scopes: SecurityScopes,
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])

        username: str | None = payload.get("sub")
        if username is None:
            raise jwt.InvalidTokenError("Invalid subject")

        scope: str = payload.get("scope", "")
        token_scopes = set(scope.split(" "))

        user = await get_user(username)
        if not user:
            raise jwt.InvalidTokenError("Invalid user")
    except (jwt.InvalidTokenError, ValidationError):
        authenticate_value = (
            f'Bearer scope="{security_scopes.scope_str}"'
            if security_scopes.scopes
            else "Bearer"
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": authenticate_value},
        )

    if not token_scopes.issuperset(security_scopes.scopes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not enough permissions",
            headers={"WWW-Authenticate": authenticate_value},
        )

    return user
