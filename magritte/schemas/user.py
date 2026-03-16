from typing import Literal

from pydantic import BaseModel

from magritte.schemas.auth import OAuth2Scope


class Token(BaseModel):
    scopes: list[OAuth2Scope]
    access_token: str
    token_type: Literal["bearer"]


class UserSignUp(BaseModel):
    username: str
    password: str


class UserProfileRead(BaseModel):
    id: int
    username: str
    preferred_name: str | None


class UserProfilesRead(BaseModel):
    users: list[UserProfileRead]
    offset: int
    limit: int
    total: int


class UserProfileUpdate(BaseModel):
    preferred_name: str | None


class UserEventPreflight(BaseModel):
    token: str
