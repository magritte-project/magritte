from enum import Enum

from pydantic import BaseModel


class ServiceFeature(str, Enum):
    READ_TOKEN = "read_token"
    """The service is able to vend service-specific bearer tokens"""

    SEARCH_SONGS = "search_songs"
    """The songs offered by service can be searched"""


class ServiceRead(BaseModel):
    name: str
    display_name: str
    active: bool
    features: list[ServiceFeature]


class ServiceToken(BaseModel):
    bearer_token: str


class ServiceSongRead(BaseModel):
    id: str
    source_url: str
    duration: float
    title: str
    artist_name: str | None
    album_title: str | None
    album_artist: str | None
    composer: str | None
    genre: str | None
    release_date: str | None
    track_number: int | None
    track_total: int | None
    disc_number: int | None
    disc_total: int | None
    lyrics: str | None
    bpm: int | None
    grouping: str | None
    mcn: str | None
    isrc: str | None
    music_brainz_release_id: str | None
    music_brainz_recording_id: str | None


class ServiceSearchResults[Item: BaseModel](BaseModel):
    items: list[Item]
    offset: int
    limit: int
