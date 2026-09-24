from typing import Annotated

from pydantic import BaseModel, Field

from magritte.schemas.artwork import ArtworkRead
from magritte.schemas.base import TAG_MAX_LENGTH, PaginatedQuery


class AlbumUpdate(BaseModel):
    title: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    artist_id: int | None = None


class AlbumRead(BaseModel):
    id: int
    title: str
    artist_id: int | None
    artworks: list[ArtworkRead] = Field(
        default_factory=lambda: [],
        description="The artworks of this album",
    )


class AlbumQuery(PaginatedQuery):
    query: Annotated[
        str | None,
        Field(
            max_length=TAG_MAX_LENGTH,
            description="Query string to filter the albums by",
        ),
    ] = None
    artist_id: Annotated[
        int | None,
        Field(
            description="ID of the artist to filter the songs by",
        ),
    ] = None
