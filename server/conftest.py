from typing import Callable

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from db import get_db_engine
from main import app
from model import create_model_tables_if_needed
from schemas.users import Token
from testseed import seed_test_data


@pytest.fixture
def client():
    try:
        # Each test gets its own isolated throwaway DB
        # that persists for the duration of that test.
        test_engine: AsyncEngine | None = None

        async def override_get_db_engine():
            nonlocal test_engine
            if test_engine is None:
                test_engine = create_async_engine("sqlite+aiosqlite://")
                await create_model_tables_if_needed(test_engine)
                await seed_test_data(test_engine)
            return test_engine

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
