from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field

TAG_MAX_LENGTH: int = 1000
"""The maximum length of a common tag such as the name of a song."""

EMBEDDED_TEXT_MAX_LENGTH: int = 5000
"""The maximum length of embedded text such as the lyrics of a song."""

PATH_MAX_LENGTH: int = 2000
"""The maximum length of a file path."""

URL_MAX_LENGTH: int = 8000
"""The maximum length of a URL."""

LIMIT_MAX: int = 250
"""The maximum number of items to read per page."""


class SortOrder(str, Enum):
    ASCENDING = "+"
    DESCENDING = "-"


class OperationResult(BaseModel):
    message: str
    row_count: int | None = None


class PaginatedQuery(BaseModel):
    offset: Annotated[int, Field(ge=0, description="The page offset to read from")] = 0
    limit: Annotated[
        int, Field(ge=1, le=LIMIT_MAX, description="How many items to read per page")
    ] = 100
