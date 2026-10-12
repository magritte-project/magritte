from typing import TYPE_CHECKING, override

import sqlalchemy as sa
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel, and_, col, func, or_, select

from magritte.model.base import LibraryModel
from magritte.schemas.auth import OAuth2Scope

if TYPE_CHECKING:
    from .extension import Extension
    from .library import Library
    from .notification import Notification


class UserLibraryLink(SQLModel, table=True):
    __tablename__: str = "user_library_links"

    user_id: int | None = Field(
        default=None,
        foreign_key="users.id",
        ondelete="CASCADE",
        primary_key=True,
    )
    library_id: int | None = Field(
        default=None,
        foreign_key="libraries.id",
        ondelete="CASCADE",
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
        ondelete="CASCADE",
        primary_key=True,
    )
    notification_id: int | None = Field(
        default=None,
        foreign_key="notifications.id",
        ondelete="CASCADE",
        primary_key=True,
    )


class UserExtensionLink(SQLModel, table=True):
    """
    Links a user to an extension they have installed.
    """

    __tablename__: str = "user_extension_links"

    extension_id: int = Field(
        default=None,
        primary_key=True,
        foreign_key="extensions.id",
        ondelete="CASCADE",
        description="The extension which is installed",
    )
    user_id: int = Field(
        default=None,
        primary_key=True,
        foreign_key="users.id",
        ondelete="CASCADE",
        description="The user who installed the extension",
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
    email: str | None = Field(
        default=None,
        description="The user's email, if any",
    )
    is_email_verified: bool = Field(
        default=False,
        description="Whether the user's email is verified",
        sa_column_kwargs={"server_default": sa.false()},
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
    enable_playback_events: bool = Field(
        default=True,
        description="Whether the user has enabled playback events",
    )
    libraries: list["Library"] = Relationship(
        back_populates="users",
        link_model=UserLibraryLink,
    )
    notifications: list["Notification"] = Relationship(
        back_populates="users",
        link_model=UserNotificationLink,
    )
    installed_extensions: list["Extension"] = Relationship(
        back_populates="users",
        link_model=UserExtensionLink,
    )
    cover_artwork_id: int | None = Field(
        default=None,
        foreign_key="artworks.id",
        ondelete="SET NULL",
        description="ID of the artwork set as the cover of this user",
    )

    @property
    def scopes(self) -> set[OAuth2Scope]:
        return OAuth2Scope.from_str(self.scope)

    @scopes.setter
    def scopes(self, scopes: set[OAuth2Scope]):
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

    @classmethod
    async def read_by_username_or_email(
        cls, username_or_email: str, session: AsyncSession
    ):
        return await session.scalar(
            select(User).where(
                or_(
                    col(User.username) == username_or_email,
                    and_(
                        col(User.email).is_not(None),
                        col(User.email) == username_or_email,
                    ),
                ),
            ),
        )
