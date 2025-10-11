import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine

from db import get_db_engine
from main import app
from model import create_model_tables_if_needed


async def override_get_db_engine():
    test_engine = create_async_engine("sqlite+aiosqlite://")
    await create_model_tables_if_needed(test_engine)
    return test_engine


@pytest.fixture
def client():
    try:
        app.dependency_overrides[get_db_engine] = override_get_db_engine
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.pop(get_db_engine, None)
