from enum import Enum
from typing import Annotated, Literal, Self

from pydantic import BaseModel, EmailStr, Field


class OAuth2Scope(str, Enum):
    PROFILE = "profile"
    LIBRARIES_READ = "library:read"
    LIBRARIES_WRITE = "library:write"
    ADMIN = "admin"

    @classmethod
    def to_str(cls, scopes: set[Self]):
        """Coerce a set of scopes into a string"""
        return " ".join(scopes)

    @classmethod
    def from_str(cls, scope: str) -> set[Self]:
        """Coerce a string into a set of scopes"""
        return {cls(scope) for scope in scope.split(" ")}


class Token(BaseModel):
    scopes: list[OAuth2Scope]
    access_token: str
    token_type: Literal["bearer"]


class SignUp(BaseModel):
    email: EmailStr | None = None
    username: Annotated[str, Field(max_length=255)]
    password: Annotated[str, Field(min_length=8, max_length=100)]


class ResetPassword(BaseModel):
    email: EmailStr


class CompleteResetPassword(BaseModel):
    email: EmailStr
    token: str
    new_password: Annotated[str, Field(min_length=8, max_length=100)]


class InstanceStatusRead(BaseModel):
    env: Literal["dev", "ci", "prod"]
    version: str
    uploads_enabled: bool
    email_enabled: bool
    first_setup_complete: bool
