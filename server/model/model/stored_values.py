import json
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import Field, col, delete, select

from model.base import LibraryModel


class StoredValue(LibraryModel, table=True):
    __tablename__: str = "stored_value"

    key: str = Field(
        unique=True,
        index=True,
        max_length=256,
        description="The lookup key",
    )

    value: str = Field(
        max_length=1024 * 1024,  # 1 MB
        description="The value",
    )

    @classmethod
    async def read_raw(cls, key: str, session: AsyncSession):
        return await session.scalar(
            select(
                col(cls.value),
            ).where(
                col(cls.key) == key,
            )
        )

    @classmethod
    async def update_raw(cls, key: str, value: str, session: AsyncSession):
        if existing := await session.scalar(select(cls).where(col(cls.key) == key)):
            existing.value = value
        else:
            new = StoredValue(
                key=key,
                value=value,
            )
            session.add(new)

        await session.flush()

    @classmethod
    async def read(cls, key: str, session: AsyncSession):
        raw_value = await cls.read_raw(key, session)
        if raw_value:
            return json.loads(raw_value)
        else:
            return None

    @classmethod
    async def update(cls, key: str, value: Any, session: AsyncSession):
        await cls.update_raw(key, json.dumps(value), session)

    @classmethod
    async def remove(cls, key: str, session: AsyncSession):
        result = await session.execute(
            delete(cls).where(
                col(cls.key) == key,
            )
        )
        return result.rowcount == 1
