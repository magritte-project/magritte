import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine

from auth import password_hash
from db import get_db_engine
from main import app
from model import create_model_tables_if_needed
from model.user import User

_test_engine: AsyncEngine | None = None


async def seed_test_data(engine: AsyncEngine):
    async with AsyncSession(engine) as session:
        try:
            session.add(
                User(
                    username="test",
                    hashed_password=password_hash.hash("password"),
                )
            )
            session.add(
                User(
                    username="unlucky",
                    hashed_password=password_hash.hash("password"),
                )
            )
            await session.flush()
        except:
            await session.rollback()
            raise
        else:
            await session.commit()


async def override_get_db_engine():
    global _test_engine
    if _test_engine is None:
        _test_engine = create_async_engine("sqlite+aiosqlite://")
        await create_model_tables_if_needed(_test_engine)
        await seed_test_data(_test_engine)
    return _test_engine


@pytest.fixture
def client():
    try:
        app.dependency_overrides[get_db_engine] = override_get_db_engine
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.pop(get_db_engine, None)
