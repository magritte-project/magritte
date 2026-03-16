from pydantic import BaseModel


class ArtistUpdate(BaseModel):
    name: str | None = None


class ArtistRead(BaseModel):
    id: int
    name: str
