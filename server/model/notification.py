from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from model.base import LibraryModel
from model.user import User, UserNotificationLink


class Notification(LibraryModel, table=True):
    __tablename__: str = "notifications"

    title: str = Field(
        max_length=255,
        description="A brief title describing the notification",
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
