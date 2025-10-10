from functools import cache

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from model import create_model_tables_if_needed


@cache
async def get_library_db_engine():
    engine = create_async_engine("sqlite+aiosqlite://")
    await create_model_tables_if_needed(engine)
    return engine


async def get_library_db_session():
    engine = await get_library_db_engine()
    async with AsyncSession(engine) as session:
        try:
            yield session
        except:
            await session.rollback()
            raise
        else:
            await session.commit()
