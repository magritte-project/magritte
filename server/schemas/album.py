from pydantic import BaseModel, Field

from schemas.artwork import ArtworkRead


class AlbumCreate(BaseModel):
    title: str
    artist_id: int | None
    artwork_ids: list[int]


class AlbumUpdate(BaseModel):
    title: str | None = None
    artist_id: int | None = None
    artwork_ids: list[int] | None = None


class AlbumRead(BaseModel):
    id: int
    title: str
    artist_id: int | None
    artworks: list[ArtworkRead] = Field(
        default_factory=lambda: [],
        description="The artworks of this song",
    )
