from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field


class NotificationsChangedListenerMessage(BaseModel):
    message_type: Literal["notifications_changed"]


class LibraryChangedListenerMessage(BaseModel):
    message_type: Literal["library_changed"]
    library_ids: list[int]


ListenerMessage = Annotated[
    Union[
        NotificationsChangedListenerMessage,
        LibraryChangedListenerMessage,
    ],
    Field(discriminator="message_type"),
]
