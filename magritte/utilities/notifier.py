from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from magritte.db import get_db_session
from magritte.model.notification import Notification
from magritte.utilities.user_events import (
    UserEvent,
    UserEvents,
    UserEventType,
    get_user_events,
)


class Notifier:
    def __init__(
        self,
        user_events: UserEvents,
        session: AsyncSession,
    ):
        self._user_events: UserEvents = user_events
        self._session: AsyncSession = session

    async def insert(
        self,
        new_notification: Notification,
    ):
        self._session.add(new_notification)
        await self.update(new_notification)

    async def update(
        self,
        notification: Notification,
    ):
        await self._session.commit()
        await self._session.refresh(notification)
        await self._user_events.notify(
            await notification.user_ids,
            UserEvent(
                event_type=UserEventType.NOTIFICATIONS_CHANGED,
                ids=[notification.id],
            ),
        )


def get_notifier(
    user_events: Annotated[UserEvents, Depends(get_user_events)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    return Notifier(user_events, session)
