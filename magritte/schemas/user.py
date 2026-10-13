from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, EmailStr, Field

from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.base import TAG_MAX_LENGTH, PaginatedQuery


class UserProfileRead(BaseModel):
    id: int
    username: str
    preferred_name: str | None


class UserProfileMeRead(UserProfileRead):
    email: str | None
    is_email_verified: bool
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


class UserProfileMeUpdate(BaseModel):
    email: EmailStr | None
    preferred_name: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    enable_playback_events: bool


class UserAdminRead(UserProfileRead):
    scopes: list[OAuth2Scope]


class UserAdminsRead(BaseModel):
    users: list[UserAdminRead]
    offset: int
    limit: int
    total: int


class UserAdminUpdate(BaseModel):
    preferred_name: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    scopes: Annotated[
        set[OAuth2Scope] | None,
        Field(
            min_length=1,
            description="The complete set of scopes to grant the user",
        ),
    ] = None


class UserEventPreflight(BaseModel):
    token: str


class UserFileAccessPreflight(BaseModel):
    token: str
    expires_at: datetime
