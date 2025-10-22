from enum import Enum
from typing import Self


class OAuth2Scope(str, Enum):
    PROFILE = "profile"
    LIBRARIES_READ = "library:read"
    LIBRARIES_WRITE = "library:write"

    @classmethod
    def to_str(cls, scopes: set[Self]):
        """Coerce a set of scopes into a string"""
        return " ".join(scopes)

    @classmethod
    def from_str(cls, scope: str) -> set[Self]:
        """Coerce a string into a set of scopes"""
        return {cls(scope) for scope in scope.split(" ")}
