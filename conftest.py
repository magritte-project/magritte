from contextlib import contextmanager
from typing import Any, Callable
from unittest.mock import AsyncMock

import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from magritte import app
from magritte.db import create_db_engine, get_db_engine
from magritte.email import EmailClient, get_email_client
from magritte.model import create_model_tables_if_needed
from magritte.schemas.user import Token
from magritte.testseed import seed_test_data


@pytest_asyncio.fixture(scope="function")
async def db_engine():
    test_engine = create_db_engine("sqlite+aiosqlite://")
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


@contextmanager
def override_dependency(original: Callable[..., Any], override: Callable[..., Any]):
    try:
        app.dependency_overrides[original] = override
        yield
    finally:
        app.dependency_overrides.pop(original, None)


@pytest.fixture
def client(db_engine: AsyncEngine):
    async def override_get_db_engine():
        return db_engine

    with override_dependency(get_db_engine, override_get_db_engine):
        with TestClient(app) as client:
            yield client


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


@pytest.fixture
def installed_mock_email_client():
    mock_email_client = AsyncMock(spec=EmailClient)

    def override_get_email_client():
        return mock_email_client

    with override_dependency(get_email_client, override_get_email_client):
        yield mock_email_client
