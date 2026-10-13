from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
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


@dataclass(frozen=True)
class TestFixtureDependencies:
    """The dependencies all test fixture objects use"""

    db_engine: AsyncEngine
    """Session for interacting with the DB"""

    client: TestClient
    """Client for making API calls"""

    faker: Faker
    """Faker for placeholder data"""


@pytest.fixture
def test_fixture_dependencies(
    db_engine: AsyncEngine,
    client: TestClient,
    faker: Faker,
):
    """The dependencies all test fixture objects use"""
    return TestFixtureDependencies(db_engine, client, faker)


class TestFixture:
    dependencies: TestFixtureDependencies
    """The dependencies for this test fixture"""

    def __init__(self, dependencies: TestFixtureDependencies) -> None:
        self.dependencies = dependencies

    @property
    def db_engine(self) -> AsyncEngine:
        return self.dependencies.db_engine

    @property
    def client(self) -> TestClient:
        return self.dependencies.client

    @property
    def faker(self) -> Faker:
        return self.dependencies.faker

    @asynccontextmanager
    async def db_session(self):
        """
        Use a fresh DB session which will automatically commit or rollback.

        :yields: An async DB session.
        """
        async with AsyncSession(self.dependencies.db_engine) as session:
            try:
                yield session
            except:
                await session.rollback()
                raise
            else:
                await session.commit()


class AuthFixture(TestFixture):
    username: str
    password: str

    def __init__(
        self,
        dependencies: TestFixtureDependencies,
        *,
        username: str,
        password: str = "password",
    ) -> None:
        super().__init__(dependencies)
        self.username = username
        self.password = password

    @property
    async def user_id(self) -> int:
        """Read the ID of the user this fixture is configured for"""

        from sqlmodel import col, select

        from magritte.model.user import User

        async with self.db_session() as session:
            user_result = await session.execute(
                select(col(User.id)).where(col(User.username) == self.username)
            )
            return user_result.scalar_one()

    def sign_in(self) -> Token:
        """Sign in using this fixture's credential and return a token"""

        token_response = self.client.post(
            "/sign-in",
            data={
                "username": self.username,
                "password": self.password,
            },
        )
        assert token_response.status_code == 200
        return Token.model_validate(token_response.json())


@pytest.fixture
def admin_auth(test_fixture_dependencies: TestFixtureDependencies):
    """First user which is always an admin"""
    return AuthFixture(test_fixture_dependencies, username="admin")


@pytest.fixture
def standard_auth(test_fixture_dependencies: TestFixtureDependencies):
    """User with the standard scopes"""
    return AuthFixture(test_fixture_dependencies, username="standard")


@pytest.fixture
def fresh_admin_auth(test_fixture_dependencies: TestFixtureDependencies):
    """User with admin scopes which has no library or other resources/configuration"""
    return AuthFixture(test_fixture_dependencies, username="fresh_admin")
