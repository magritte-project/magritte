from datetime import timedelta

from httpx import AsyncClient

from schemas.artwork import ArtworkKind
from schemas.service import (
    ServiceArtworkRead,
    ServiceSearchResults,
    ServiceSongRead,
    ServiceSourceRead,
)

from .config import config
from .utilities.token import create_developer_token

_apple_music_client = AsyncClient(
    base_url="https://api.music.apple.com/",
)

display_name = "Apple Music"
if config.team_id and config.app_id and config.key_id and config.key_secret:
    features = ["read_token", "search_songs"]
else:
    features = []


async def read_token():
    return create_developer_token(
        expires_after=timedelta(days=7),
        team_id=config.team_id,
        app_id=config.app_id,
        key_id=config.key_id,
        key_secret=config.key_secret,
        algorithm=config.algorithm,
    )


async def search_songs(
    query: str,
    offset: int,
    limit: int,
):
    response = await _apple_music_client.get(
        f"/v1/catalog/{config.storefront}/search",
        params={
            "term": query,
            "types": "songs",
            "offset": offset,
            "limit": limit,
        },
        headers={"Authorization": f"Bearer {await read_token()}"},
    )
    response.raise_for_status()
    response_json = response.json()
    song_data = response_json["results"]["songs"]["data"]

    return ServiceSearchResults(
        items=[
            ServiceSongRead(
                id=song["id"],
                duration=song["attributes"]["durationInMillis"] / 1000,
                sources=[
                    ServiceSourceRead(
                        url=f"applemusic:///songs/{song['id']}",
                    ),
                ],
                artworks=[
                    ServiceArtworkRead(
                        kind=ArtworkKind.FRONT_COVER,
                        image_url=song["attributes"]["artwork"]["url"]
                        .replace(
                            "{w}",
                            str(min(1000, song["attributes"]["artwork"]["width"])),
                        )
                        .replace(
                            "{h}",
                            str(min(1000, song["attributes"]["artwork"]["height"])),
                        ),
                        background_color=song["attributes"]["artwork"].get("bgColor"),
                        primary_color=song["attributes"]["artwork"].get("textColor1"),
                        secondary_color=song["attributes"]["artwork"].get("textColor2"),
                        tertiary_color=song["attributes"]["artwork"].get("textColor3"),
                    ),
                ],
                title=song["attributes"]["name"],
                artist_name=song["attributes"]["artistName"],
                album_title=song["attributes"]["albumName"],
                album_artist=None,
                composer=song["attributes"].get("composerName"),
                genre=", ".join(song["attributes"].get("genreNames", [])),
                release_date=song["attributes"].get("releaseDate"),
                track_number=song["attributes"].get("trackNumber"),
                track_total=None,
                disc_number=song["attributes"].get("discNumber"),
                disc_total=None,
                lyrics=None,
                bpm=None,
                grouping=None,
                mcn=None,
                isrc=song["attributes"].get("isrc"),
                music_brainz_release_id=None,
                music_brainz_recording_id=None,
            )
            for song in song_data
        ],
        offset=offset,
        limit=limit,
    )
