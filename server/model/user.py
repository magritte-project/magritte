from typing import TYPE_CHECKING

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, SQLModel, col, select

from model.base import LibraryModel
from schemas.auth import OAuth2Scope

if TYPE_CHECKING:
    from .library import Library


class UserLibraryLink(SQLModel, table=True):
    __tablename__: str = "user_library_links"

    user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        primary_key=True,
    )
    library_id: int | None = Field(
        default=None,
        foreign_key="libraries.id",
        primary_key=True,
    )
    can_view: bool = Field(
        default=True,
        description="Whether the user may view this library",
    )
    can_add: bool = Field(
        default=False,
        description="Whether the user may add songs to this library",
    )
    can_edit: bool = Field(
        default=False,
        description="Whether the user may edit songs in this library",
    )
    can_remove: bool = Field(
        default=False,
        description="Whether the user may remove songs in this library",
    )


class User(LibraryModel, table=True):
    __tablename__: str = "users"

    username: str = Field(
        unique=True,
        index=True,
        min_length=1,
        max_length=255,
        description="The user's handle",
    )
    preferred_name: str | None = Field(
        default=None,
        min_length=1,
        description="The user's preferred name",
    )
    hashed_password: str = Field(
        description="This user's password",
    )
    scope: str = Field(
        default_factory=lambda: OAuth2Scope.to_str({*OAuth2Scope}),
        description="The user's enabled scopes",
    )
    libraries: list["Library"] = Relationship(
        back_populates="users",
        link_model=UserLibraryLink,
    )

    @classmethod
    async def read_by_username(cls, username: str, session: AsyncSession):
        return await session.scalar(
            select(User).where(
                col(User.username) == username,
            ),
        )
