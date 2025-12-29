from datetime import timedelta

from httpx import AsyncClient

from schemas.service import ServiceKind, ServiceSearchResult, ServiceSearchResults

from .config import config
from .utilities.token import create_developer_token

_apple_music_client = AsyncClient(
    base_url="https://api.music.apple.com/",
)

display_name = "Apple Music"
if config.team_id and config.key_id and config.key_secret:
    features = ["read_token", "search"]
else:
    features = []


async def read_token():
    return create_developer_token(
        expires_after=timedelta(days=7),
        team_id=config.team_id,
        key_id=config.key_id,
        key_secret=config.key_secret,
        algorithm=config.algorithm,
    )


async def search(
    query: str,
    kind: set[ServiceKind],
    offset: int,
    limit: int,
):
    response = await _apple_music_client.get(
        f"/v1/catalog/{config.storefront}/search",
        params={
            "term": query,
            "types": [kind.value for kind in kind],
            "offset": offset,
            "limit": limit,
        },
        headers={"Authorization": f"Bearer {await read_token()}"},
    )
    response.raise_for_status()
    response_json = response.json()
    song_data = response_json["results"]["songs"]["data"]

    return ServiceSearchResults(
        results=[
            ServiceSearchResult(
                kind=ServiceKind(song["type"]),
                id=song["id"],
                title=song["attributes"]["name"],
                artist_name=song["attributes"]["artistName"],
                album_title=song["attributes"]["albumName"],
            )
            for song in song_data
        ],
        offset=offset,
        limit=limit,
    )
