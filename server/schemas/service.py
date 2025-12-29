from enum import Enum

from pydantic import BaseModel


class ServiceFeature(str, Enum):
    READ_TOKEN = "read_token"
    """The service is able to vend service-specific bearer tokens"""

    SEARCH = "search"
    """The content offered by service can be searched"""


class ServiceRead(BaseModel):
    name: str
    display_name: str
    active: bool
    features: list[ServiceFeature]


class ServiceToken(BaseModel):
    bearer_token: str


class ServiceKind(str, Enum):
    SONGS = "songs"
    """Include results for songs"""


class ServiceSearchResult(BaseModel):
    kind: ServiceKind
    id: str
    title: str
    artist_name: str | None
    album_title: str | None


class ServiceSearchResults(BaseModel):
    results: list[ServiceSearchResult]
    offset: int
    limit: int
