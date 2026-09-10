from typing import Annotated

from pydantic import BaseModel, Field

from magritte.schemas.base import TAG_MAX_LENGTH, PaginatedQuery


class ArtistUpdate(BaseModel):
    name: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None


class ArtistRead(BaseModel):
    id: int
    name: str


class ArtistQuery(PaginatedQuery):
    query: Annotated[
        str | None,
        Field(
            max_length=TAG_MAX_LENGTH,
            description="Query string to filter the artists by",
        ),
    ] = None
