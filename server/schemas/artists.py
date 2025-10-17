from pydantic import BaseModel


class ArtistRead(BaseModel):
    id: int
    name: str
