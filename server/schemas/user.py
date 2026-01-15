from typing import Literal

from pydantic import BaseModel

from schemas.auth import OAuth2Scope


class Token(BaseModel):
    scopes: list[OAuth2Scope]
    access_token: str
    token_type: Literal["bearer"]


class UserSignUp(BaseModel):
    username: str
    password: str


class UserProfile(BaseModel):
    username: str
    preferred_name: str | None


class UserProfileUpdate(BaseModel):
    preferred_name: str | None


class UserEventPreflight(BaseModel):
    token: str


class UserEvent(BaseModel):
    event_type: Literal["notifications_changed", "libraries_changed"]
    ids: list[int]
