from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from conftest import AuthFixture
from magritte.auth import FeatureScope, create_feature_token, password_hash
from magritte.config import get_secrets_config
from magritte.model.user import User


async def _update_user(auth: AuthFixture, **values: Any):
    async with auth.db_session() as session:
        user = await session.get_one(User, await auth.user_id)
        for key, value in values.items():
            setattr(user, key, value)


class TestSignUp:
    def test_with_fresh_credentials(
        self,
        client: TestClient,
    ):
        response = client.post(
            "/sign-up",
            json={
                "username": "rene",
                "password": "Th3L1$t3n1ngR00m",
            },
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("email") is None
        assert response_json.get("username") == "rene"
        assert response_json.get("preferred_name") is None

    def test_rejects_already_in_use_usernames(
        self,
        client: TestClient,
    ):
        response = client.post(
            "/sign-up",
            json={
                "username": "admin",
                "password": "passpass",
            },
        )
        assert response.status_code == 409
        assert response.json().get("detail") == "Username already taken"

    def test_with_email_sends_verification(
        self,
        client: TestClient,
        installed_mock_email_client: AsyncMock,
    ):
        response = client.post(
            "/sign-up",
            json={
                "email": "anybody@nowhere.com",
                "username": "anybody",
                "password": "passpass",
            },
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("email") == "anybody@nowhere.com"

        installed_mock_email_client.send.assert_called_once()

    def test_with_email_rejects_already_in_use_email(
        self,
        client: TestClient,
        installed_mock_email_client: AsyncMock,
    ):
        response_1 = client.post(
            "/sign-up",
            json={
                "email": "anybody@nowhere.com",
                "username": "anybody",
                "password": "passpass",
            },
        )
        assert response_1.status_code == 200

        response_2 = client.post(
            "/sign-up",
            json={
                "email": "anybody@nowhere.com",
                "username": "anybody2",
                "password": "passpass",
            },
        )
        assert response_2.status_code == 409
        assert response_2.json().get("detail") == "Email already in use"

        # It should only send the email for the successful request
        installed_mock_email_client.send.assert_called_once()

    def test_requires_email_when_configured(
        self,
        client: TestClient,
        installed_mock_email_client: AsyncMock,
    ):
        response = client.post(
            "/sign-up",
            json={
                "username": "admin",
                "password": "passpass",
            },
        )
        assert response.status_code == 422
        assert response.json().get("detail") == "Email required"

        installed_mock_email_client.send.assert_not_called()


class TestSignIn:
    def test_with_valid_credentials(
        self,
        client: TestClient,
    ):
        token_response = client.post(
            "/sign-in",
            data={
                "username": "admin",
                "password": "password",
            },
        )
        token_json = token_response.json()
        assert token_response.status_code == 200
        assert "scopes" in token_json
        assert "access_token" in token_json
        assert token_json.get("token_type") == "bearer"

    def test_requires_right_password(
        self,
        client: TestClient,
    ):
        token_response = client.post(
            "/sign-in",
            data={
                "username": "admin",
                "password": "nope",
            },
        )
        assert token_response.status_code == 400
        assert token_response.json().get("detail") == "Incorrect username or password"

    def test_requires_user_to_exist(
        self,
        client: TestClient,
    ):
        token_response = client.post(
            "/sign-in",
            data={
                "username": "noone",
                "password": "pass",
            },
        )
        assert token_response.status_code == 400
        assert token_response.json().get("detail") == "Incorrect username or password"


class TestVerifyEmail:
    async def _read_is_email_verified(self, auth: AuthFixture) -> bool:
        async with auth.db_session() as session:
            user = await session.get_one(User, await auth.user_id)
            return user.is_email_verified

    def _create_token(
        self,
        auth: AuthFixture,
        scope: FeatureScope = FeatureScope.USER_VERIFY_EMAIL,
    ) -> str:
        token, _ = create_feature_token(
            subject=auth.username,
            scope=scope,
            expire_after=timedelta(hours=1),
        )
        return token

    @pytest.mark.asyncio
    async def test_marks_user_email_as_verified(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await _update_user(standard_auth, is_email_verified=False)

        response = client.post(
            "/verify-email",
            params={"token": self._create_token(standard_auth)},
        )
        assert response.status_code == 200
        assert response.json().get("message") == "Email verified"

        assert await self._read_is_email_verified(standard_auth) is True

    @pytest.mark.asyncio
    async def test_requires_email_when_configured(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        await _update_user(standard_auth, is_email_verified=False)

        response = client.post(
            "/verify-email",
            params={"token": self._create_token(standard_auth)},
        )
        assert response.status_code == 501
        assert response.json().get("detail") == "Not configured to support emails"

        assert await self._read_is_email_verified(standard_auth) is False

    @pytest.mark.asyncio
    async def test_requires_user_to_have_email(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await _update_user(standard_auth, email=None, is_email_verified=False)

        response = client.post(
            "/verify-email",
            params={"token": self._create_token(standard_auth)},
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "User has no email"

        assert await self._read_is_email_verified(standard_auth) is False

    @pytest.mark.asyncio
    async def test_requires_email_not_to_be_verified(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        # Seeded users already have verified emails
        response = client.post(
            "/verify-email",
            params={"token": self._create_token(standard_auth)},
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "Email already verified"

    @pytest.mark.asyncio
    async def test_requires_verify_email_scope(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await _update_user(standard_auth, is_email_verified=False)

        response = client.post(
            "/verify-email",
            params={
                "token": self._create_token(
                    standard_auth, scope=FeatureScope.FILES_READ
                )
            },
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not enough permissions"

        assert await self._read_is_email_verified(standard_auth) is False


class TestResetPassword:
    @pytest.mark.asyncio
    async def test_configures_user_and_sends_email(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        response = client.post(
            "/reset-password",
            json={"email": "standard@example.com"},
        )
        assert response.status_code == 200
        assert response.json().get("message") == "Reset password email sent"

        async with standard_auth.db_session() as session:
            user = await session.get_one(User, await standard_auth.user_id)
            assert user.hashed_reset_password_token is not None
            assert user.reset_password_token_created_at is not None

        installed_mock_email_client.send.assert_called_once()

    @pytest.mark.asyncio
    async def test_requires_email_when_configured(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        response = client.post(
            "/reset-password",
            json={"email": "standard@example.com"},
        )
        assert response.status_code == 501
        assert response.json().get("detail") == "Not configured to support emails"

        async with standard_auth.db_session() as session:
            user = await session.get_one(User, await standard_auth.user_id)
            assert user.hashed_reset_password_token is None

    @pytest.mark.asyncio
    async def test_requires_user_to_have_email(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await _update_user(standard_auth, email=None)

        response = client.post(
            "/reset-password",
            json={"email": "standard@example.com"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "User not found"

        installed_mock_email_client.send.assert_not_called()


class TestResetPasswordComplete:
    _token = "reset-token"

    async def _set_reset_token(
        self,
        auth: AuthFixture,
        created_at: datetime | None = None,
    ):
        await _update_user(
            auth,
            hashed_reset_password_token=password_hash.hash(
                self._token, salt=get_secrets_config().salt
            ),
            reset_password_token_created_at=created_at or datetime.now(UTC),
        )

    def _sign_in_status(self, client: TestClient, password: str) -> int:
        return client.post(
            "/sign-in",
            data={"username": "standard", "password": password},
        ).status_code

    @pytest.mark.asyncio
    async def test_updates_password(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await self._set_reset_token(standard_auth)

        response = client.post(
            "/reset-password/complete",
            json={
                "email": "standard@example.com",
                "token": self._token,
                "new_password": "n3wpassword",
            },
        )
        assert response.status_code == 200
        assert response.json().get("message") == "Password reset complete"

        assert self._sign_in_status(client, "n3wpassword") == 200
        assert self._sign_in_status(client, "password") == 400

        async with standard_auth.db_session() as session:
            user = await session.get_one(User, await standard_auth.user_id)
            assert user.hashed_reset_password_token is None
            assert user.reset_password_token_created_at is None

    @pytest.mark.asyncio
    async def test_requires_token_to_match(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await self._set_reset_token(standard_auth)

        response = client.post(
            "/reset-password/complete",
            json={
                "email": "standard@example.com",
                "token": "wrong-token",
                "new_password": "n3wpassword",
            },
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "Invalid token"

        assert self._sign_in_status(client, "password") == 200

    @pytest.mark.asyncio
    async def test_requires_token_to_not_be_expired(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await self._set_reset_token(
            standard_auth,
            created_at=datetime.now(UTC) - timedelta(hours=1),
        )

        response = client.post(
            "/reset-password/complete",
            json={
                "email": "standard@example.com",
                "token": self._token,
                "new_password": "n3wpassword",
            },
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "Invalid token"

        assert self._sign_in_status(client, "password") == 200

    @pytest.mark.asyncio
    async def test_requires_email_when_configured(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        await self._set_reset_token(standard_auth)

        response = client.post(
            "/reset-password/complete",
            json={
                "email": "standard@example.com",
                "token": self._token,
                "new_password": "n3wpassword",
            },
        )
        assert response.status_code == 501
        assert response.json().get("detail") == "Not configured to support emails"

        assert self._sign_in_status(client, "password") == 200

    @pytest.mark.asyncio
    async def test_requires_user_to_have_email(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        await self._set_reset_token(standard_auth)
        await _update_user(standard_auth, email=None)

        response = client.post(
            "/reset-password/complete",
            json={
                "email": "standard@example.com",
                "token": self._token,
                "new_password": "n3wpassword",
            },
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "User not found"

        assert self._sign_in_status(client, "password") == 200
