from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, and_, col, select

from magritte.model.album import Album, AlbumLibraryLink
from magritte.model.artist import Artist, ArtistLibraryLink
from magritte.model.artwork import Artwork
from magritte.model.base import LibraryModel
from magritte.model.ignored_resource import IgnoredResource, IgnoredResourceLibraryLink
from magritte.model.song import Song, SongLibraryLink
from magritte.model.user import User, UserLibraryLink


class Library(LibraryModel, table=True):
    __tablename__: str = "libraries"

    name: str = Field(
        unique=True,
        min_length=1,
        description="The name of this library",
    )
    home_path: str | None = Field(
        unique=True,
        description="The files for this library, if any. A path relative to library_home.",
    )
    uploads_enabled: bool = Field(
        default=False,
        description="Whether this library allows uploads. Requires a home_path.",
    )
    users: list[User] = Relationship(
        back_populates="libraries",
        link_model=UserLibraryLink,
    )
    songs: list[Song] = Relationship(
        back_populates="libraries",
        link_model=SongLibraryLink,
    )
    artists: list[Artist] = Relationship(
        back_populates="libraries",
        link_model=ArtistLibraryLink,
    )
    albums: list[Album] = Relationship(
        back_populates="libraries",
        link_model=AlbumLibraryLink,
    )
    ignored_resources: list[IgnoredResource] = Relationship(
        back_populates="libraries",
        link_model=IgnoredResourceLibraryLink,
    )
    cover_artwork_id: int | None = Field(
        default=None,
        foreign_key="artworks.id",
        ondelete="SET NULL",
        description="ID of the artwork set as the cover of this library",
    )
    cover_artwork: Artwork | None = Relationship()

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
    def ids_for_user(
        cls,
        user_id: int,
        can_add: bool | None = None,
        can_edit: bool | None = None,
        can_remove: bool | None = None,
    ):
        """
        Build a query selecting the IDs of the libraries a user belongs to.

        :param user_id: The user whose libraries to select.
        :param can_add: If specified, the add permission the user must have.
        :param can_edit: If specified, the edit permission the user must have.
        :param can_remove: If specified, the remove permission the user must have.
        :returns: A select statement suitable for use with `in_`.
        """
        return select(col(UserLibraryLink.library_id)).where(
            col(UserLibraryLink.user_id) == user_id,
            *cls._build_permissions(can_add, can_edit, can_remove),
        )

    @classmethod
    async def user_has_permission_on_all(
        cls,
        libraries: list["Library"],
        user_id: int,
        session: AsyncSession,
        can_add: bool | None = None,
        can_edit: bool | None = None,
        can_remove: bool | None = None,
    ) -> bool:
        """
        Check whether a user has the given permissions on every one of the given libraries.
        Used before changing shared media, so a user cannot change media in a library
        they only have partial access to by way of another library.

        :param libraries: The libraries to check.
        :param user_id: The user to check.
        :param session: The DB to read from.
        :returns: `True` if the user has the permissions on every library.
        """
        allowed_ids = set(
            await session.scalars(
                cls.ids_for_user(user_id, can_add, can_edit, can_remove)
            )
        )
        return all(library.id in allowed_ids for library in libraries)

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
