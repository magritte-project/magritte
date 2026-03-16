from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from pwdlib import PasswordHash
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from magritte.config import config
from magritte.db import get_db_session
from magritte.model.user import User
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.user import Token

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/sign-in",
    scopes={
        OAuth2Scope.PROFILE: "Access the user's own profile",
        OAuth2Scope.LIBRARIES_READ: "Access libraries on this instance",
        OAuth2Scope.LIBRARIES_WRITE: "Change libraries on this instance",
        OAuth2Scope.ADMIN: "Administer this instance",
    },
)

password_hash = PasswordHash.recommended()


def _create_access_token(
    subject: str,
    scopes: set[OAuth2Scope] = set(),
    expire_after: timedelta | None = timedelta(weeks=4),
):
    to_encode = dict[str, Any]()
    to_encode["sub"] = subject
    if scopes:
        to_encode["scope"] = OAuth2Scope.to_str(scopes)
    if expire_after:
        to_encode["exp"] = datetime.now(UTC) + expire_after
    return jwt.encode(to_encode, config.session_token_secret, config.token_algorithm)


def _read_access_token(token: str) -> tuple[str, set[OAuth2Scope]]:
    to_decode = jwt.decode(
        token, config.session_token_secret, algorithms=[config.token_algorithm]
    )
    subject = to_decode.get("sub")
    if not isinstance(subject, str):
        raise jwt.InvalidTokenError("Bad subject")

    scope = to_decode.get("scope")
    if scope is not None and not isinstance(scope, str):
        raise jwt.InvalidTokenError("Bad scope")

    scopes = OAuth2Scope.from_str(scope)

    return subject, scopes


async def create_user(
    username: str,
    password: str,
    session: AsyncSession,
):
    is_first_user = await User.count(session) == 0
    if is_first_user:
        scopes = {
            OAuth2Scope.PROFILE,
            OAuth2Scope.LIBRARIES_READ,
            OAuth2Scope.LIBRARIES_WRITE,
            OAuth2Scope.ADMIN,
        }
    else:
        scopes = {
            OAuth2Scope.PROFILE,
            OAuth2Scope.LIBRARIES_READ,
        }
    new_user = User(
        username=username,
        hashed_password=password_hash.hash(password, salt=config.salt),
        scope=OAuth2Scope.to_str(scopes),
    )
    session.add(new_user)
    return new_user


async def authenticate_user(
    username: str,
    password: str,
    session: AsyncSession,
):
    user = await User.read_by_username(username, session)
    if not user:
        return None
    if not password_hash.verify(password, user.hashed_password):
        return None

    return Token(
        scopes=list(user.scopes),
        access_token=_create_access_token(user.username, user.scopes),
        token_type="bearer",
    )


async def get_current_user(
    security_scopes: SecurityScopes,
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        username, token_scopes = _read_access_token(token)
        user = await User.read_by_username(username, session)
        if not user:
            raise jwt.InvalidTokenError("Invalid user")
    except (jwt.InvalidTokenError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={
                "WWW-Authenticate": (
                    f'Bearer scope="{security_scopes.scope_str}"'
                    if security_scopes.scopes
                    else "Bearer"
                )
            },
        ) from e

    if not token_scopes.issuperset(
        security_scopes.scopes
    ) or not user.scopes.issuperset(security_scopes.scopes):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not enough permissions",
            headers={
                "WWW-Authenticate": (
                    f'Bearer scope="{security_scopes.scope_str}"'
                    if security_scopes.scopes
                    else "Bearer"
                )
            },
        )

    return user
