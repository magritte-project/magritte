from typing import TYPE_CHECKING, override

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel, col, func, select

from model.base import LibraryModel
from schemas.auth import OAuth2Scope

if TYPE_CHECKING:
    from .library import Library
    from .notification import Notification


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


class UserNotificationLink(SQLModel, table=True):
    __tablename__: str = "user_notification_links"

    user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        primary_key=True,
    )
    notification_id: int | None = Field(
        default=None,
        foreign_key="notifications.id",
        primary_key=True,
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
        description="The user's enabled scopes",
    )
    libraries: list["Library"] = Relationship(
        back_populates="users",
        link_model=UserLibraryLink,
    )
    notifications: list["Notification"] = Relationship(
        back_populates="users",
        link_model=UserNotificationLink,
    )

    @property
    def scopes(self) -> set[OAuth2Scope]:
        return OAuth2Scope.from_str(self.scope)

    @scopes.setter
    def set_scopes(self, scopes: set[OAuth2Scope]):
        self.scope = OAuth2Scope.to_str(scopes)

    @override
    @classmethod
    def query_str_fields(cls) -> list[Mapped[str] | Mapped[str | None]]:
        return [
            col(User.username),
            col(User.preferred_name),
        ]

    @classmethod
    async def count(cls, session: AsyncSession):
        """
        Count the number of existing users.
        """
        return await session.scalar(select(func.count()).select_from(cls)) or 0

    @classmethod
    async def read_by_username(cls, username: str, session: AsyncSession):
        return await session.scalar(
            select(User).where(
                col(User.username) == username,
            ),
        )
