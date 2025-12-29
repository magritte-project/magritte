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
    title: str
    artist_name: str | None
    album_title: str | None
    source_url: str
    duration: int


class ServiceSearchResults[Item: BaseModel](BaseModel):
    items: list[Item]
    offset: int
    limit: int
