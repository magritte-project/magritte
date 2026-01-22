import pytest
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from conftest import SignIn
from model.notification import Notification
from model.user import User


class TestReadNotifications:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        db_session: AsyncSession,
        faker: Faker,
        sign_in: SignIn,
    ):
        for _ in range(3):
            db_session.add(
                Notification(
                    title=faker.sentence(),
                    description=faker.sentence(),
                    users=[await db_session.get_one(User, 1)],
                )
            )
        await db_session.commit()

        session = sign_in("test", "password")

        response = client.get(
            "/users/notifications",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("total") == 3
        assert all(
            notification.get("title") is not None
            and notification.get("description") is not None
            and notification.get("is_read") is False
            for notification in response_json.get("items")
        )

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/users/notifications",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadNotification:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        db_session: AsyncSession,
        faker: Faker,
        sign_in: SignIn,
    ):
        notification = Notification(
            title=faker.sentence(),
            description=faker.sentence(),
            users=[await db_session.get_one(User, 1)],
        )
        db_session.add(notification)
        await db_session.flush()
        notification_id = notification.id
        await db_session.commit()

        session = sign_in("test", "password")

        response = client.get(
            f"/users/notifications/{notification_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200

        assert response_json.get("title") is not None
        assert response_json.get("description") is not None
        assert response_json.get("is_read") is False

    @pytest.mark.asyncio
    async def test_requires_access_to_notification(
        self,
        client: TestClient,
        db_session: AsyncSession,
        faker: Faker,
        sign_in: SignIn,
    ):
        notification = Notification(
            title=faker.sentence(),
            description=faker.sentence(),
            users=[],
        )
        db_session.add(notification)
        await db_session.flush()
        notification_id = notification.id
        await db_session.commit()

        session = sign_in("test", "password")

        response = client.get(
            f"/users/notifications/{notification_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Notification not found"

    @pytest.mark.asyncio
    async def test_requires_notification_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.get(
            "/users/notifications/999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Notification not found"

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/users/notifications/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestUpdateNotification:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        db_session: AsyncSession,
        faker: Faker,
        sign_in: SignIn,
    ):
        notification = Notification(
            title=faker.sentence(),
            description=faker.sentence(),
            users=[await db_session.get_one(User, 1)],
        )
        db_session.add(notification)
        await db_session.flush()
        notification_id = notification.id
        await db_session.commit()

        session = sign_in("test", "password")

        response = client.patch(
            f"/users/notifications/{notification_id}",
            json={"is_read": True},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200

        assert response_json.get("title") is not None
        assert response_json.get("description") is not None
        assert response_json.get("is_read") is True

    @pytest.mark.asyncio
    async def test_requires_access_to_notification(
        self,
        client: TestClient,
        db_session: AsyncSession,
        faker: Faker,
        sign_in: SignIn,
    ):
        notification = Notification(
            title=faker.sentence(),
            description=faker.sentence(),
            users=[],
        )
        db_session.add(notification)
        await db_session.flush()
        notification_id = notification.id
        await db_session.commit()

        session = sign_in("test", "password")

        response = client.patch(
            f"/users/notifications/{notification_id}",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Notification not found"

    @pytest.mark.asyncio
    async def test_requires_notification_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            "/users/notifications/999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Notification not found"

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.patch(
            "/users/notifications/1",
            json={},
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadUsers:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.get(
            "/users/all",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("total") >= 4
        assert all(
            user.get("id") is not None and user.get("username") is not None
            for user in response_json.get("users")
        )

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/users/all",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadUser:
    @pytest.mark.asyncio
    async def test_read_by_id(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.get(
            "/users/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == 1
        assert response_json.get("username") == "test"

    @pytest.mark.asyncio
    async def test_read_by_username(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.get(
            "/users/all/unlucky",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == 2
        assert response_json.get("username") == "unlucky"

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/users/all/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"
