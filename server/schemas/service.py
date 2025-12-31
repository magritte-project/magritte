from enum import Enum

from pydantic import BaseModel

from schemas.artwork import ArtworkKind


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


class ServiceArtworkRead(BaseModel):
    kind: ArtworkKind
    image_url: str
    background_color: str | None
    primary_color: str | None
    secondary_color: str | None
    tertiary_color: str | None


class ServiceSourceRead(BaseModel):
    url: str


class ServiceSongRead(BaseModel):
    id: str
    duration: float
    sources: list[ServiceSourceRead]
    artworks: list[ServiceArtworkRead]
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
