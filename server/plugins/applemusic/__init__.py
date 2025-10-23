from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status
from httpx import AsyncClient

from plugins.applemusic.config import (
    APPLE_MUSIC_ALGORITHM,
    APPLE_MUSIC_KEY_ID,
    APPLE_MUSIC_KEY_SECRET,
    APPLE_MUSIC_TEAM_ID,
)
from plugins.applemusic.schemas.auth import AppleMusicPreauthorization
from plugins.applemusic.utilities.token import create_developer_token

router = APIRouter()

api_client = AsyncClient(base_url="https://api.music.apple.com/")


@router.get(
    "/preauthorize",
    response_model=AppleMusicPreauthorization,
    summary="Get a short-lived access token",
)
async def preauthorize(ttl_hours: Annotated[int, Query()] = 6):
    if not APPLE_MUSIC_TEAM_ID or not APPLE_MUSIC_KEY_ID or not APPLE_MUSIC_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server not configured for Apple Music",
        )

    developer_token = create_developer_token(
        expires_after=timedelta(hours=ttl_hours),
        team_id=APPLE_MUSIC_TEAM_ID,
        key_id=APPLE_MUSIC_KEY_ID,
        key_secret=APPLE_MUSIC_KEY_SECRET,
        algorithm=APPLE_MUSIC_ALGORITHM,
    )
    return AppleMusicPreauthorization(
        developer_token=developer_token,
    )
