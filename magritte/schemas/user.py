from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.base import TAG_MAX_LENGTH, PaginatedQuery


class Token(BaseModel):
    scopes: list[OAuth2Scope]
    access_token: str
    token_type: Literal["bearer"]


class UserSignUp(BaseModel):
    username: Annotated[str, Field(max_length=255)]
    password: Annotated[str, Field(min_length=8, max_length=100)]


class UserProfileRead(BaseModel):
    id: int
    username: str
    preferred_name: str | None
    enable_playback_events: bool


class UserProfilesQuery(PaginatedQuery):
    query: Annotated[
        str | None,
        Field(
            max_length=255,
            description="Query string to filter the users by",
        ),
    ] = None


class UserProfilesRead(BaseModel):
    users: list[UserProfileRead]
    offset: int
    limit: int
    total: int


class UserProfileUpdate(BaseModel):
    preferred_name: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    enable_playback_events: bool


class UserEventPreflight(BaseModel):
    token: str


class UserFileAccessPreflight(BaseModel):
    token: str
    expires_at: datetime
