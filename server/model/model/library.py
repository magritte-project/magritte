from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, and_, col, select

from model.album import Album, AlbumLibraryLink
from model.artist import Artist, ArtistLibraryLink
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
        sa_relationship_kwargs={"lazy": "noload"},
    )
    artists: list[Artist] = Relationship(
        back_populates="libraries",
        link_model=ArtistLibraryLink,
        sa_relationship_kwargs={"lazy": "noload"},
    )
    albums: list[Album] = Relationship(
        back_populates="libraries",
        link_model=AlbumLibraryLink,
        sa_relationship_kwargs={"lazy": "noload"},
    )

    @classmethod
    def _build_permissions(
        cls,
        can_add: bool | None,
        can_edit: bool | None,
        can_remove: bool | None,
    ):
        permissions = list[ColumnExpressionArgument]()
        if can_add is not None:
            permissions.append(col(UserLibraryLink.can_add) == can_add)
        if can_edit is not None:
            permissions.append(col(UserLibraryLink.can_edit) == can_edit)
        if can_remove is not None:
            permissions.append(col(UserLibraryLink.can_remove) == can_remove)
        return permissions

    @classmethod
    async def read_all(
        cls,
        user_id: int,
        session: AsyncSession,
        can_add: bool | None = None,
        can_edit: bool | None = None,
        can_remove: bool | None = None,
    ):
        return await session.scalars(
            select(cls)
            .where(
                *cls._build_permissions(can_add, can_edit, can_remove),
            )
            .join(
                UserLibraryLink,
                and_(
                    col(UserLibraryLink.library_id) == col(cls.id),
                    col(UserLibraryLink.user_id) == user_id,
                ),
            )
        )

    @classmethod
    async def can_user_access_by_id(
        cls,
        id: int,
        user_id: int,
        session: AsyncSession,
        can_add: bool | None = None,
        can_edit: bool | None = None,
        can_remove: bool | None = None,
    ):
        return await cls.exists(
            where=[
                col(cls.id) == id,
                *cls._build_permissions(can_add, can_edit, can_remove),
            ],
            joins=[
                (
                    UserLibraryLink,
                    and_(
                        col(UserLibraryLink.library_id) == col(cls.id),
                        col(UserLibraryLink.user_id) == user_id,
                    ),
                )
            ],
            session=session,
        )

    @classmethod
    async def read_by_id(
        cls,
        id: int,
        user_id: int,
        session: AsyncSession,
        can_add: bool | None = None,
        can_edit: bool | None = None,
        can_remove: bool | None = None,
    ):
        return await session.scalar(
            select(cls)
            .where(
                col(cls.id) == id,
                *cls._build_permissions(can_add, can_edit, can_remove),
            )
            .join(
                UserLibraryLink,
                and_(
                    col(UserLibraryLink.library_id) == col(cls.id),
                    col(UserLibraryLink.user_id) == user_id,
                ),
            )
        )

    @classmethod
    async def read_by_name(
        cls,
        name: str,
        user_id: int,
        session: AsyncSession,
        can_add: bool | None = None,
        can_edit: bool | None = None,
        can_remove: bool | None = None,
    ):
        return await session.scalar(
            select(cls)
            .where(
                col(cls.name) == name,
                *cls._build_permissions(can_add, can_edit, can_remove),
            )
            .join(
                UserLibraryLink,
                and_(
                    col(UserLibraryLink.library_id) == col(cls.id),
                    col(UserLibraryLink.user_id) == user_id,
                ),
            )
        )
