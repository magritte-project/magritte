from sqlmodel import Field, Relationship

from model.base import LibraryModel
from model.song import Song, SongLibraryLink
from model.user import User, UserLibraryLink


class Library(LibraryModel, table=True):
    __tablename__: str = "libraries"

    name: str = Field(
        unique=True,
        min_length=1,
        description="The name of this library",
    )
    users: list[User] = Relationship(
        back_populates="libraries",
        link_model=UserLibraryLink,
    )
    songs: list[Song] = Relationship(
        back_populates="libraries",
        link_model=SongLibraryLink,
    )
