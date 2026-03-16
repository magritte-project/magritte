import pytest
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from conftest import SignIn
from magritte.model.notification import Notification
from magritte.model.user import User


class NotificationsFixture:
    def __init__(self, db_session: AsyncSession, faker: Faker):
        self.db_session = db_session
        self.faker = faker

    async def throwaway_notification(
        self,
        users_or_ids: list[User | int],
        /,
        title: str | None = None,
        description: str | None = None,
        progress: float | None = None,
        is_locked: bool = False,
    ):
        users = list[User]()
        for user_or_id in users_or_ids:
            if isinstance(user_or_id, User):
                users.append(user_or_id)
            else:
                users.append(await self.db_session.get_one(User, user_or_id))
        notification = Notification(
            title=title or self.faker.sentence(),
            description=description or self.faker.sentence(),
            progress=progress,
            is_locked=is_locked,
            users=users,
        )
        self.db_session.add(notification)
        await self.db_session.flush()
        notification_id = notification.id
        await self.db_session.commit()
        return notification_id


@pytest.fixture
def notifications_fixture(
    db_session: AsyncSession,
    faker: Faker,
):
    return NotificationsFixture(db_session, faker)


class TestReadNotifications:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        notifications_fixture: NotificationsFixture,
        sign_in: SignIn,
    ):
        notification_ids = [
            await notifications_fixture.throwaway_notification([1]) for _ in range(3)
        ]

        session = sign_in("test", "password")

        response = client.get(
            "/users/notifications",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("total") == 3
        assert sorted(notification_ids) == sorted(
            notification.get("id") for notification in response_json.get("items")
        )
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
        notifications_fixture: NotificationsFixture,
        db_session: AsyncSession,
        faker: Faker,
        sign_in: SignIn,
    ):
        notification_id = await notifications_fixture.throwaway_notification([1])

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
        notifications_fixture: NotificationsFixture,
        sign_in: SignIn,
    ):
        notification_id = await notifications_fixture.throwaway_notification([])

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
        notifications_fixture: NotificationsFixture,
        sign_in: SignIn,
    ):
        notification_id = await notifications_fixture.throwaway_notification([1])

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
    async def test_cannot_update_locked_notification(
        self,
        client: TestClient,
        notifications_fixture: NotificationsFixture,
        sign_in: SignIn,
    ):
        notification_id = await notifications_fixture.throwaway_notification(
            [1], is_locked=True
        )

        session = sign_in("test", "password")

        response = client.patch(
            f"/users/notifications/{notification_id}",
            json={"is_read": True},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "Notification is locked"

    @pytest.mark.asyncio
    async def test_requires_access_to_notification(
        self,
        client: TestClient,
        notifications_fixture: NotificationsFixture,
        faker: Faker,
        sign_in: SignIn,
    ):
        notification_id = await notifications_fixture.throwaway_notification([])

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


class TestMarkAllNotificationsRead:
    @pytest.mark.asyncio
    async def test_mark_all_read(
        self,
        client: TestClient,
        notifications_fixture: NotificationsFixture,
        sign_in: SignIn,
    ):
        unlocked_notification = await notifications_fixture.throwaway_notification([1])
        locked_notification = await notifications_fixture.throwaway_notification(
            [1], is_locked=True
        )
        session = sign_in("test", "password")

        mark_all_response = client.post(
            "/users/notifications/mark-all-read",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        mark_all_response_json = mark_all_response.json()
        assert mark_all_response.status_code == 200
        assert mark_all_response_json.get("message") == "Notifications marked as read"
        assert mark_all_response_json.get("row_count") == 1

        read_response = client.get(
            "/users/notifications",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        read_response_json = read_response.json()
        assert read_response.status_code == 200
        assert read_response_json.get("total") == 2
        assert any(
            notification.get("id") == unlocked_notification
            and notification.get("is_read") is True
            for notification in read_response_json.get("items")
        ), "It should mark unlocked notifications as read"
        assert any(
            notification.get("id") == locked_notification
            and notification.get("is_read") is False
            for notification in read_response_json.get("items")
        ), "It should not mark locked notifications as read"

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.post(
            "/users/notifications/mark-all-read",
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
