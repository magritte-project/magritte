from typing import Annotated

from fastapi import Depends
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine

from magritte.config import config
from magritte.model import create_model_tables_if_needed

_engine: AsyncEngine | None = None


def create_db_engine(url: str) -> AsyncEngine:
    """
    Create an engine for the database at `url`.

    SQLite does not enforce foreign keys (including `ondelete` actions) unless
    enabled for each connection, so engines for SQLite databases enable them.
    """
    engine = create_async_engine(url)
    if engine.dialect.name == "sqlite":

        @event.listens_for(engine.sync_engine, "connect")
        def enable_foreign_keys(dbapi_connection, _connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys=ON")
            cursor.close()

    return engine


async def get_db_engine():
    global _engine
    if _engine is None:
        _engine = create_db_engine(config.db)
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
