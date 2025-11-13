from typing import Callable

import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine

from db import get_db_engine
from main import app
from model import create_model_tables_if_needed
from schemas.user import Token
from testseed import seed_test_data


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    test_engine = create_async_engine("sqlite+aiosqlite://")
    await create_model_tables_if_needed(test_engine)
    await seed_test_data(test_engine)
    yield test_engine


@pytest_asyncio.fixture
async def db_session(db_engine: AsyncEngine):
    async with AsyncSession(db_engine) as session:
        try:
            yield session
        except:
            await session.rollback()
            raise
        else:
            await session.commit()


@pytest.fixture
def client(db_engine: AsyncEngine):
    try:

        async def override_get_db_engine():
            return db_engine

        app.dependency_overrides[get_db_engine] = override_get_db_engine
        with TestClient(app) as client:
            yield client
    finally:
        app.dependency_overrides.pop(get_db_engine, None)


SignIn = Callable[[str, str], Token]


@pytest.fixture
def sign_in(client: TestClient):
    def do_sign_in(username: str, password: str):
        token_response = client.post(
            "/sign-in",
            data={
                "username": username,
                "password": password,
            },
        )
        assert token_response.status_code == 200
        return Token.model_validate(token_response.json())

    return do_sign_in


@pytest.fixture
def faker():
    return Faker()
