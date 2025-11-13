from pydantic import BaseModel


class ArtistCreate(BaseModel):
    name: str


class ArtistUpdate(BaseModel):
    name: str | None = None


class ArtistRead(BaseModel):
    id: int
    name: str
