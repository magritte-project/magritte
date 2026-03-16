import os
from datetime import datetime, timedelta

import jwt
from fastapi import Request, Response
from starlette.responses import JSONResponse

_team_id: str = os.environ.get("APPLE_MUSIC_TEAM_ID", "")
"""The team ID from Apple Connect"""

_app_id: str = os.environ.get("APPLE_MUSIC_APP_ID", "")
"""The app ID for the Apple Music key from Apple Connect"""

_key_id: str = os.environ.get("APPLE_MUSIC_KEY_ID", "")
"""The ID of the Apple Music key from Apple Connect"""

_key_secret: str = os.environ.get("APPLE_MUSIC_KEY_SECRET", "")
"""The private secret of the Apple Music key from Apple Connect"""

_storefront: str = os.environ.get("APPLE_MUSIC_STOREFRONT", "us")
"""The storefront to make Apple Music calls to"""


if not _team_id or not _app_id or not _key_id or not _key_secret:
    raise NotImplementedError()


def handler(request: Request) -> Response:
    issued_at = datetime.now()
    expires_at = issued_at + timedelta(days=7)
    headers = {
        "alg": "ES256",
        "kid": _key_id,
    }
    payload = {
        "iss": _team_id,
        "iat": issued_at,
        "exp": expires_at,
        "sub": _app_id,
    }
    token = jwt.encode(
        payload,
        _key_secret,
        algorithm="ES256",
        headers=headers,
    )
    return JSONResponse(
        content={
            "developer_token": token,
        },
    )
