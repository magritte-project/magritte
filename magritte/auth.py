import base64
import binascii
import hmac
import logging
from datetime import UTC, datetime, timedelta
from enum import Enum
from functools import lru_cache
from typing import Annotated, Any
from urllib.parse import quote

import jwt
from fastapi import Depends, HTTPException, Query, WebSocketException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from pwdlib import PasswordHash
from pydantic import ValidationError
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.requests import HTTPConnection

from magritte.config import config, get_secrets_config
from magritte.db import get_db_session
from magritte.email import EmailClient, EmailRecipient
from magritte.email.templates import render_email_template
from magritte.model.user import User
from magritte.schemas.auth import OAuth2Scope, Token

logger = logging.getLogger(__name__)

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


def _uses_shared_salt(hashed_password: str) -> bool:
    """
    Check whether a password hash was created with the instance-wide salt
    which older versions of Magritte used for every password.

    :param hashed_password: An argon2 hash in PHC string format.
    :returns: `True` if the hash's salt is the instance-wide salt.
    """
    # $argon2id$v=19$m=...,t=...,p=...$<salt>$<hash>
    parts = hashed_password.split("$")
    if len(parts) != 6:
        return False
    encoded_salt = parts[4]
    try:
        salt = base64.b64decode(encoded_salt + "=" * (-len(encoded_salt) % 4))
    except (ValueError, binascii.Error):
        return False
    return hmac.compare_digest(salt, get_secrets_config().salt)


def _verify_user_password(user: User, password: str) -> bool:
    """
    Verify a user's password, upgrading the stored hash if it uses outdated
    parameters or the instance-wide salt older versions of Magritte used.

    :param user: The user whose password to check.
    :param password: The password to check.
    :returns: `True` if the password is correct.
    """
    is_valid, updated_hash = password_hash.verify_and_update(
        password, user.hashed_password
    )
    if not is_valid:
        return False
    if updated_hash is not None:
        user.hashed_password = updated_hash
    elif _uses_shared_salt(user.hashed_password):
        user.hashed_password = password_hash.hash(password)
    return True


def _read_token_subject(to_decode: dict[str, Any]) -> tuple[int, str]:
    """
    Read and validate the user ID and session key claims of a decoded token.

    :raises: A `jwt.InvalidTokenError` if either claim is missing or malformed.
    """
    subject = to_decode.get("sub")
    if not isinstance(subject, str) or not subject.isdigit():
        raise jwt.InvalidTokenError("Bad subject")

    key = to_decode.get("key")
    if not isinstance(key, str):
        raise jwt.InvalidTokenError("Bad key")

    return int(subject), key


async def _read_token_user(user_id: int, key: str, session: AsyncSession) -> User:
    """
    Read the user a token was issued to, checking the token hasn't been revoked.

    :raises: A `jwt.InvalidTokenError` if the user doesn't exist or the token's
    key no longer matches the user's session key.
    """
    user = await session.get(User, user_id)
    if not user or not hmac.compare_digest(key, user.session_key):
        raise jwt.InvalidTokenError("Invalid user")
    return user


def _create_access_token(
    user: User,
    scopes: set[OAuth2Scope] = set(),
    expire_after: timedelta | None = timedelta(weeks=4),
):
    to_encode = dict[str, Any]()
    to_encode["sub"] = str(user.id)
    to_encode["key"] = user.session_key
    if scopes:
        to_encode["scope"] = OAuth2Scope.to_str(scopes)
    if expire_after:
        to_encode["exp"] = datetime.now(UTC) + expire_after
    return jwt.encode(
        to_encode, get_secrets_config().session_token_secret, config.token_algorithm
    )


def _read_access_token(token: str) -> tuple[int, str, set[OAuth2Scope]]:
    to_decode = jwt.decode(
        token,
        get_secrets_config().session_token_secret,
        algorithms=[config.token_algorithm],
    )
    user_id, key = _read_token_subject(to_decode)

    scope = to_decode.get("scope")
    if not isinstance(scope, str):
        raise jwt.InvalidTokenError("Bad scope")

    scopes = OAuth2Scope.from_str(scope)

    return user_id, key, scopes


async def create_user(
    username: str,
    password: str,
    session: AsyncSession,
) -> User:
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
        hashed_password=password_hash.hash(password),
        scope=OAuth2Scope.to_str(scopes),
    )
    session.add(new_user)
    return new_user


async def authenticate_user(
    username: str,
    password: str,
    session: AsyncSession,
    accept_email: bool = False,
) -> Token | None:
    if accept_email:
        user = await User.read_by_username_or_email(username, session)
    else:
        user = await User.read_by_username(username, session)
    if not user:
        return None
    if not _verify_user_password(user, password):
        return None

    return Token(
        scopes=list(user.scopes),
        access_token=_create_access_token(user, user.scopes),
        token_type="bearer",
    )


async def get_current_user(
    security_scopes: SecurityScopes,
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        user_id, key, token_scopes = _read_access_token(token)
        user = await _read_token_user(user_id, key, session)
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


class FeatureScope(str, Enum):
    FILES_READ = "files:read"
    """
    Scope which allows reading file resources.
    """

    USER_EVENTS_STREAM = "user:events:stream"
    """
    Scope which allows streaming user events.
    """

    USER_VERIFY_EMAIL = "user:email:verify"
    """
    Scope which allows verifying a user's email.
    """


def create_feature_token(
    *,
    user: User,
    scope: FeatureScope,
    expire_after: timedelta,
) -> tuple[str, datetime]:
    """
    Create a feature access token with the given parameters.

    :param user: The user the token grants access as.
    :param scope: The scope of the feature access token. Unlike a session token,
    a feature token may only grant a single scope.
    :param expires_after: How long the feature access token will be valid for.
    :returns: Tuple of token, expires at.
    """

    expires_at = datetime.now(UTC) + expire_after
    to_encode = dict[str, Any]()
    to_encode["sub"] = str(user.id)
    to_encode["key"] = user.session_key
    to_encode["scope"] = scope.value
    to_encode["exp"] = expires_at
    token = jwt.encode(
        to_encode, get_secrets_config().feature_token_secret, config.token_algorithm
    )
    return token, expires_at


def _read_feature_token(token: str) -> tuple[int, str, FeatureScope]:
    """
    Read the contents of a feature access token,
    validating that it's well-formed.

    :param token: A feature access token.
    :returns: Tuple of user ID, session key, scope for the caller to further verify.
    :raises: A `jwt.InvalidTokenError` error if the token is malformed.
    """

    to_decode = jwt.decode(
        token,
        get_secrets_config().feature_token_secret,
        algorithms=[config.token_algorithm],
    )
    user_id, key = _read_token_subject(to_decode)

    raw_scope = to_decode.get("scope")
    if not isinstance(raw_scope, str):
        raise jwt.InvalidTokenError("Bad scope")

    try:
        scope = FeatureScope(raw_scope)
    except ValueError as e:
        raise jwt.InvalidTokenError("Invalid scope") from e

    return user_id, key, scope


@lru_cache()
def get_feature_user(required_scope: FeatureScope):
    """
    Returns an injectable to get the current user by
    decoding the feature token attached to the request.

    :param required_scope: The scope which the feature token must specify.
    :returns: An injectable.
    """

    async def get_feature_user(
        conn: HTTPConnection,
        token: Annotated[
            str,
            Query(
                description="A feature token",
            ),
        ],
        session: Annotated[AsyncSession, Depends(get_db_session)],
    ) -> User:
        try:
            user_id, key, scope = _read_feature_token(token)
            user = await _read_token_user(user_id, key, session)
        except (jwt.InvalidTokenError, ValidationError) as e:
            if conn.scope["type"] == "websocket":
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="Could not validate credentials",
                ) from e
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Could not validate credentials",
                ) from e

        if scope != required_scope:
            if conn.scope["type"] == "websocket":
                raise WebSocketException(
                    code=status.WS_1008_POLICY_VIOLATION,
                    reason="Not enough permissions",
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Not enough permissions",
                )

        return user

    return get_feature_user


def create_verify_email_token(user: User) -> tuple[str, datetime]:
    """
    Create a token which allows a user to verify their email.

    :param user: The user whose email to verify. Must already be flushed to the DB.
    :returns: Tuple of token, expires at.
    """
    return create_feature_token(
        user=user,
        scope=FeatureScope.USER_VERIFY_EMAIL,
        expire_after=timedelta(hours=1),
    )


async def send_verification_email(
    email_client: EmailClient,
    *,
    user_email: str,
    user_username: str,
    token: str,
    expires_at: datetime,
):
    try:
        text, html = await render_email_template(
            "verify_email",
            {
                "name": user_username,
                "verify_link": f"{config.web_url}/verify/{token}",
                "expiration": expires_at.strftime("%Y-%m-%d %H:%M UTC"),
            },
        )
        await email_client.send(
            sender=EmailRecipient(address=config.email_sender_address, name="Magritte"),
            subject="Verify Your Email",
            to={EmailRecipient(address=user_email, name=user_username)},
            text=text,
            html=html,
        )
    except Exception as e:
        logger.exception(
            f"*** Failed to send verification email from <{config.email_sender_address}>: {str(e)}"
        )


async def send_reset_password_email(
    email_client: EmailClient,
    *,
    user_email: str,
    user_username: str,
    token: str,
):
    try:
        text, html = await render_email_template(
            "reset_password",
            {
                "name": user_username,
                "reset_link": f"{config.web_url}/reset-password/complete?token={quote(token)}&email={quote(user_email)}",
            },
        )
        await email_client.send(
            sender=EmailRecipient(address=config.email_sender_address, name="Magritte"),
            subject="Reset Your Password",
            to={EmailRecipient(address=user_email, name=user_username)},
            text=text,
            html=html,
        )
    except Exception as e:
        logger.exception(
            f"*** Failed to send reset password email from <{config.email_sender_address}>: {str(e)}"
        )
