from enum import Enum
from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field

from magritte.utilities.files import is_file_uri

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


def _reject_file_url(url: str) -> str:
    if is_file_uri(url):
        raise ValueError("Forbidden URL")
    return url


ClientUrl = Annotated[
    str,
    Field(max_length=URL_MAX_LENGTH),
    AfterValidator(_reject_file_url),
]
"""
A URL provided by a client. Local `file:` URLs are rejected because only
Magritte itself may create sources and artworks backed by local files.
"""


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
