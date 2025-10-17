from pydantic import BaseModel

from model.artwork import ArtworkKind


class ArtworkRead(BaseModel):
    id: int
    kind: ArtworkKind
