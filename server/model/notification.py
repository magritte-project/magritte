from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, Relationship, col, select

from model.base import LibraryModel
from model.user import User, UserNotificationLink


class Notification(LibraryModel, table=True):
    __tablename__: str = "notifications"

    title: str = Field(
        max_length=255,
        description="A brief title describing the notification",
    )
    description: str | None = Field(
        default=None,
        max_length=1000,
        description="A detailed description of the notification",
    )
    progress: float | None = Field(
        default=None,
        description="The progress of the operation represented by the notification",
    )
    is_locked: bool = Field(
        default=False,
        description="Whether the notification cannot be modified through the API",
    )
    is_read: bool = Field(
        default=False,
        description="Whether the notification has been read by the user",
    )
    users: list[User] = Relationship(
        back_populates="notifications",
        link_model=UserNotificationLink,
    )

    @classmethod
    async def read_one_for_user(
        cls,
        notification_id: int,
        user_id: int,
        session: AsyncSession,
    ):
        """
        Read a single notification for the specified user.

        :param notification_id: The ID of the notification to read.
        :param user_id: The ID of the user to read the notification for.
        :param session: The database session to use.
        :returns: The notification if found, otherwise None.
        """
        return await session.scalar(
            select(cls).where(
                col(cls.id) == notification_id,
                col(cls.users).any(col(UserNotificationLink.user_id) == user_id),
            )
        )
