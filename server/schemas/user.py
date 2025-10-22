from typing import Literal

from pydantic import BaseModel


class Token(BaseModel):
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
