from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db_session
from model.notification import Notification
from schemas.listener import NotificationsChangedListenerMessage
from utilities.listeners import ListenerManager, get_listener_manager


class Notifier:
    def __init__(self, listener_manager: ListenerManager, session: AsyncSession):
        self._listener_manager = listener_manager
        self._session = session

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

        await self._listener_manager.send_message(
            await notification.user_ids,
            NotificationsChangedListenerMessage(notification_ids=[notification.id]),
        )


def get_notifier(
    listener_manager: ListenerManager = Depends(get_listener_manager),
    session: AsyncSession = Depends(get_db_session),
):
    return Notifier(listener_manager, session)
