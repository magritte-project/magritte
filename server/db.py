from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine

from config import DB
from model import create_model_tables_if_needed

_engine: AsyncEngine | None = None


async def get_db_engine():
    global _engine
    if _engine is None:
        _engine = create_async_engine(DB)
        await create_model_tables_if_needed(_engine)
    return _engine


async def get_db_session(engine: Annotated[AsyncEngine, Depends(get_db_engine)]):
    async with AsyncSession(engine) as session:
        try:
            yield session
        except:
            await session.rollback()
            raise
        else:
            await session.commit()
