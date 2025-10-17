from pydantic import BaseModel, Field

from schemas.artwork import ArtworkRead


class AlbumRead(BaseModel):
    id: int
    title: str
    artworks: list[ArtworkRead] = Field(
        default_factory=lambda: [],
        description="The artworks of this song",
    )
