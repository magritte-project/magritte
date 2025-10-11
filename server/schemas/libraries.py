from pydantic import BaseModel


class LibraryCreate(BaseModel):
    name: str


class LibraryRead(BaseModel):
    id: int
    name: str


class LibraryMediaRead[Item: BaseModel](BaseModel):
    items: list[Item]
    offset: int
    limit: int
    total: int
