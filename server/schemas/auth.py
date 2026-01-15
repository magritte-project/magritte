from enum import Enum
from typing import Literal, Self

from pydantic import BaseModel

from schemas.service import ServiceRead


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


class InstanceStatusRead(BaseModel):
    env: Literal["dev", "ci", "prod"]
    watch_library: bool
    first_setup_complete: bool
    available_services: list[ServiceRead]
