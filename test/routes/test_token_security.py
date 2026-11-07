"""
Regression tests for session token revocation and password hashing.
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import jwt
import pytest
from fastapi.testclient import TestClient

from conftest import AuthFixture
from magritte.auth import _uses_shared_salt, password_hash
from magritte.config import config, get_secrets_config
from magritte.model.user import User


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _files_token(client: TestClient, access_token: str) -> str:
    response = client.post("/users/files/preflight", headers=_auth(access_token))
    assert response.status_code == 200
    return response.json()["token"]


async def _read_user_id(auth: AuthFixture) -> int:
    return await auth.user_id


async def _read_hashed_password(auth: AuthFixture) -> str:
    async with auth.db_session() as session:
        user = await session.get_one(User, await auth.user_id)
        return user.hashed_password


class TestSessionTokens:
    def test_deleted_user_token_does_not_carry_over_to_new_user(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        standard_auth: AuthFixture,
    ):
        old_token = standard_auth.sign_in().access_token
        old_id = client.get("/users/me", headers=_auth(old_token)).json()["id"]

        response = client.delete(
            f"/users/admin/all/{old_id}",
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 200

        response = client.post(
            "/sign-up",
            json={
                "username": "standard",
                "password": "different-password",
                "email": "new-standard@example.com",
            },
        )
        assert response.status_code == 200

        response = client.get("/users/me", headers=_auth(old_token))
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_password_reset_revokes_existing_tokens(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        old_token = standard_auth.sign_in().access_token
        old_files_token = _files_token(client, old_token)

        async with standard_auth.db_session() as session:
            user = await session.get_one(User, await standard_auth.user_id)
            user.hashed_reset_password_token = password_hash.hash("reset-token")
            user.reset_password_token_created_at = datetime.now(UTC)

        response = client.post(
            "/reset-password/complete",
            json={
                "email": "standard@example.com",
                "token": "reset-token",
                "new_password": "n3wpassword",
            },
        )
        assert response.status_code == 200

        assert client.get("/users/me", headers=_auth(old_token)).status_code == 401
        response = client.get("/artworks/1/image", params={"token": old_files_token})
        assert response.status_code == 401

        new_session = client.post(
            "/sign-in", data={"username": "standard", "password": "n3wpassword"}
        ).json()
        response = client.get("/users/me", headers=_auth(new_session["access_token"]))
        assert response.status_code == 200

    def test_rejects_legacy_username_token(self, client: TestClient):
        legacy_token = jwt.encode(
            {
                "sub": "admin",
                "scope": "profile",
                "exp": datetime.now(UTC) + timedelta(hours=1),
            },
            get_secrets_config().session_token_secret,
            config.token_algorithm,
        )
        response = client.get("/users/me", headers=_auth(legacy_token))
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_rejects_token_with_wrong_key(
        self, client: TestClient, standard_auth: AuthFixture
    ):
        user_id = await _read_user_id(standard_auth)
        forged_token = jwt.encode(
            {
                "sub": str(user_id),
                "key": "0" * 64,
                "scope": "profile",
                "exp": datetime.now(UTC) + timedelta(hours=1),
            },
            get_secrets_config().session_token_secret,
            config.token_algorithm,
        )
        response = client.get("/users/me", headers=_auth(forged_token))
        assert response.status_code == 401


class TestPasswordHashing:
    @pytest.mark.asyncio
    async def test_same_password_hashes_differ(
        self, admin_auth: AuthFixture, standard_auth: AuthFixture
    ):
        # Seeded users all have the password "password"
        admin_hash = await _read_hashed_password(admin_auth)
        standard_hash = await _read_hashed_password(standard_auth)
        assert admin_hash != standard_hash
        assert not _uses_shared_salt(admin_hash)

    def test_sign_up_does_not_use_shared_salt(self, client: TestClient):
        client.post(
            "/sign-up",
            json={
                "username": "salty",
                "password": "password123",
                "email": "salty@example.com",
            },
        )
        response = client.post(
            "/sign-in", data={"username": "salty", "password": "password123"}
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_sign_in_upgrades_shared_salt_hash(
        self, client: TestClient, standard_auth: AuthFixture
    ):
        legacy_hash = password_hash.hash("password", salt=get_secrets_config().salt)
        assert _uses_shared_salt(legacy_hash)
        async with standard_auth.db_session() as session:
            user = await session.get_one(User, await standard_auth.user_id)
            user.hashed_password = legacy_hash

        standard_auth.sign_in()

        upgraded_hash = await _read_hashed_password(standard_auth)
        assert upgraded_hash != legacy_hash
        assert not _uses_shared_salt(upgraded_hash)
        assert password_hash.verify("password", upgraded_hash)
        standard_auth.sign_in()

    @pytest.mark.asyncio
    async def test_failed_sign_in_does_not_change_hash(
        self, client: TestClient, standard_auth: AuthFixture
    ):
        legacy_hash = password_hash.hash("password", salt=get_secrets_config().salt)
        async with standard_auth.db_session() as session:
            user = await session.get_one(User, await standard_auth.user_id)
            user.hashed_password = legacy_hash

        response = client.post(
            "/sign-in", data={"username": "standard", "password": "wrong-password"}
        )
        assert response.status_code == 400
        assert await _read_hashed_password(standard_auth) == legacy_hash
