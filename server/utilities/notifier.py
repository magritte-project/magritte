from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from db import get_db_session
from model.notification import Notification


class Notifier:
    def __init__(self, session: AsyncSession):
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


def get_notifier(
    session: AsyncSession = Depends(get_db_session),
):
    return Notifier(session)
