from contextlib import nullcontext as no_raise
from datetime import UTC, datetime
from unittest.mock import AsyncMock

import pytest
from faker import Faker
from fastapi import WebSocketDisconnect, status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from conftest import AuthFixture
from magritte.model.library import Library
from magritte.model.notification import Notification
from magritte.model.playback_event import PlaybackEvent
from magritte.model.song import Song
from magritte.model.user import User, UserLibraryLink
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.playback_event import PlaybackEventKind


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
        admin_auth: AuthFixture,
    ):
        notification_ids = [
            await notifications_fixture.throwaway_notification([1]) for _ in range(3)
        ]

        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification([1])

        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification([])

        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification([1])

        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification(
            [1], is_locked=True
        )

        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification([])

        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

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


class TestDeleteNotification:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        notifications_fixture: NotificationsFixture,
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification([1])

        session = admin_auth.sign_in()

        response = client.delete(
            f"/users/notifications/{notification_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("message") == "Notification deleted"

    @pytest.mark.asyncio
    async def test_cannot_update_locked_notification(
        self,
        client: TestClient,
        notifications_fixture: NotificationsFixture,
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification(
            [1], is_locked=True
        )

        session = admin_auth.sign_in()

        response = client.delete(
            f"/users/notifications/{notification_id}",
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
        admin_auth: AuthFixture,
    ):
        notification_id = await notifications_fixture.throwaway_notification([])

        session = admin_auth.sign_in()

        response = client.delete(
            f"/users/notifications/{notification_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Notification not found"

    @pytest.mark.asyncio
    async def test_requires_notification_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.delete(
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
        response = client.delete(
            "/users/notifications/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestMarkAllNotificationsRead:
    @pytest.mark.asyncio
    async def test_mark_all_read(
        self,
        client: TestClient,
        notifications_fixture: NotificationsFixture,
        admin_auth: AuthFixture,
    ):
        unlocked_notification = await notifications_fixture.throwaway_notification([1])
        locked_notification = await notifications_fixture.throwaway_notification(
            [1], is_locked=True
        )
        session = admin_auth.sign_in()

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


class TestUpdateMe:
    @pytest.mark.asyncio
    async def test_sends_new_verification_email(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        session = admin_auth.sign_in()

        response = client.post(
            "/users/me",
            json={
                "email": "nobody@example.com",
                "preferred_name": None,
                "enable_playback_events": False,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("email") == "nobody@example.com"
        assert response_json.get("is_email_verified") is False

        installed_mock_email_client.send.assert_called_once()

        # Re-submitting the same email should not send another verification email
        repeat_response = client.post(
            "/users/me",
            json={
                "email": "nobody@example.com",
                "preferred_name": None,
                "enable_playback_events": False,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert repeat_response.status_code == 200

        installed_mock_email_client.send.assert_called_once()

    @pytest.mark.asyncio
    async def test_cannot_change_to_taken_email(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
        installed_mock_email_client: AsyncMock,
    ):
        first_session = admin_auth.sign_in()

        first_response = client.post(
            "/users/me",
            json={
                "email": "nobody@example.com",
                "preferred_name": None,
                "enable_playback_events": False,
            },
            headers={"Authorization": f"Bearer {first_session.access_token}"},
        )
        assert first_response.status_code == 200

        second_session = fresh_admin_auth.sign_in()

        second_response = client.post(
            "/users/me",
            json={
                "email": "nobody@example.com",
                "preferred_name": None,
                "enable_playback_events": False,
            },
            headers={"Authorization": f"Bearer {second_session.access_token}"},
        )
        assert second_response.status_code == 409
        assert second_response.json().get("detail") == "Email already in use"

        # It should only send the email for the successful request
        installed_mock_email_client.send.assert_called_once()

    @pytest.mark.asyncio
    async def test_cannot_unset_email(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        set_response = client.post(
            "/users/me",
            json={
                "email": "nobody@example.com",
                "preferred_name": None,
                "enable_playback_events": False,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert set_response.status_code == 200
        assert set_response.json().get("email") == "nobody@example.com"

        clear_response = client.post(
            "/users/me",
            json={
                "email": None,
                "preferred_name": None,
                "enable_playback_events": False,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert clear_response.status_code == 400
        assert clear_response.json().get("detail") == "Cannot clear email"


class TestReadUsers:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/users/all",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("total") >= 3
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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/users/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == 1
        assert response_json.get("username") == "admin"

    @pytest.mark.asyncio
    async def test_read_by_username(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/users/all/admin",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == 1
        assert response_json.get("username") == "admin"

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


class TestReadUsersAdmin:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/users/admin/all",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("total") >= 3
        assert all(
            user.get("id") is not None
            and user.get("username") is not None
            and len(user.get("scopes")) > 0
            for user in response_json.get("users")
        )

        users_by_name = {
            user.get("username"): user for user in response_json.get("users")
        }
        assert users_by_name["standard"].get("scopes") == [
            "library:read",
            "profile",
        ]

    @pytest.mark.asyncio
    async def test_query(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/users/admin/all",
            params={"query": "standard"},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("total") == 1
        assert [user.get("username") for user in response_json.get("users")] == [
            "standard"
        ]

    @pytest.mark.asyncio
    async def test_requires_admin(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

        response = client.get(
            "/users/admin/all",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/users/admin/all",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadUserAdmin:
    @pytest.mark.asyncio
    async def test_read_by_id(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/users/admin/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == 1
        assert response_json.get("username") == "admin"

    @pytest.mark.asyncio
    async def test_read_by_username(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/users/admin/all/admin",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == 1
        assert response_json.get("username") == "admin"

    @pytest.mark.asyncio
    async def test_requires_admin(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

        response = client.get(
            "/users/admin/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/users/admin/all/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestUpdateUserAdmin:
    @pytest.mark.asyncio
    async def test_update(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.patch(
            f"/users/admin/all/{await fresh_admin_auth.user_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={
                "preferred_name": "Lucky",
                "scopes": ["profile", "library:read"],
            },
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == await fresh_admin_auth.user_id
        assert response_json.get("preferred_name") == "Lucky"
        assert sorted(response_json.get("scopes")) == ["library:read", "profile"]

        updated_session = fresh_admin_auth.sign_in()
        assert sorted(updated_session.scopes) == [
            OAuth2Scope.LIBRARIES_READ,
            OAuth2Scope.PROFILE,
        ]

    @pytest.mark.asyncio
    async def test_partial_update(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.patch(
            f"/users/admin/all/{await fresh_admin_auth.user_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={"preferred_name": "Lucky"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("username") == "fresh_admin"
        assert response_json.get("preferred_name") == "Lucky"
        assert sorted(response_json.get("scopes")) == sorted(OAuth2Scope)

    @pytest.mark.asyncio
    async def test_can_update_own_scopes_keeping_admin(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.patch(
            "/users/admin/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={"scopes": ["profile", "admin"]},
        )
        assert response.status_code == 200
        assert sorted(response.json().get("scopes")) == ["admin", "profile"]

    @pytest.mark.asyncio
    async def test_cannot_remove_own_admin_scope(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.patch(
            "/users/admin/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={"scopes": ["profile", "library:read"]},
        )
        assert response.status_code == 400
        assert (
            response.json().get("detail")
            == "Cannot remove admin scope from the signed in user"
        )

        updated_session = admin_auth.sign_in()
        assert OAuth2Scope.ADMIN in updated_session.scopes

    @pytest.mark.asyncio
    async def test_can_remove_admin_scope_from_other_user(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.patch(
            "/users/admin/all/2",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={"scopes": ["profile"]},
        )
        assert response.status_code == 200
        assert response.json().get("scopes") == ["profile"]

    @pytest.mark.asyncio
    async def test_rejects_empty_scopes(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.patch(
            "/users/admin/all/2",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={"scopes": []},
        )
        assert response.status_code == 422

        updated_session = fresh_admin_auth.sign_in()
        assert sorted(updated_session.scopes) == sorted(OAuth2Scope)

    @pytest.mark.asyncio
    async def test_requires_user_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.patch(
            "/users/admin/all/9999",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={"preferred_name": "Nobody"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "User not found"

    @pytest.mark.asyncio
    async def test_requires_admin(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

        response = client.patch(
            "/users/admin/all/3",
            headers={"Authorization": f"Bearer {session.access_token}"},
            json={"scopes": [*OAuth2Scope]},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.patch(
            "/users/admin/all/1",
            json={"preferred_name": "Nobody"},
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestDeleteUserAdmin:
    @pytest.mark.asyncio
    async def test_delete(
        self,
        client: TestClient,
        db_session: AsyncSession,
        admin_auth: AuthFixture,
    ):
        solo_library = Library(name="Solo", home_path=None)
        db_session.add(solo_library)
        await db_session.flush()
        solo_library_id = solo_library.id
        db_session.add(UserLibraryLink(user_id=2, library_id=solo_library_id))
        await db_session.commit()

        session = admin_auth.sign_in()

        response = client.delete(
            "/users/admin/all/2",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert response.json().get("row_count") == 1

        db_session.expire_all()
        assert await db_session.get(User, 2) is None
        # Libraries linked only to the deleted user are removed
        assert await db_session.get(Library, solo_library_id) is None
        # Libraries shared with other users are kept
        scratch_library = await db_session.get(Library, 2)
        assert scratch_library is not None
        assert [user.id for user in await scratch_library.awaitable_attrs.users] == [1]

        response = client.get(
            "/users/admin/all/2",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_deletes_playback_events(
        self,
        client: TestClient,
        db_session: AsyncSession,
        admin_auth: AuthFixture,
    ):
        song = Song()
        db_session.add(song)
        await db_session.flush()
        playback_event = PlaybackEvent(
            recorded_at=datetime.now(UTC),
            kind=PlaybackEventKind.PLAY,
            user_id=2,
            song_id=song.id,
            start_time=0,
            end_time=0,
        )
        db_session.add(playback_event)
        await db_session.flush()
        playback_event_id = playback_event.id
        await db_session.commit()

        session = admin_auth.sign_in()

        response = client.delete(
            "/users/admin/all/2",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

        db_session.expire_all()
        assert await db_session.get(PlaybackEvent, playback_event_id) is None

    @pytest.mark.asyncio
    async def test_cannot_delete_self(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.delete(
            "/users/admin/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "Cannot delete the signed in user"

        response = client.get(
            "/users/admin/all/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_requires_user_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.delete(
            "/users/admin/all/9999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "User not found"

    @pytest.mark.asyncio
    async def test_requires_admin(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

        response = client.delete(
            "/users/admin/all/4",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.delete(
            "/users/admin/all/4",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestStreamUserEvents:
    @pytest.mark.asyncio
    async def test_with_valid_token(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.post(
            "/users/events/preflight",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        token = response.json().get("token")
        assert token is not None

        with no_raise():
            with client.websocket_connect(f"/users/events?token={token}"):
                pass

    @pytest.mark.asyncio
    async def test_with_invalid_token(
        self,
        client: TestClient,
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect("/users/events?token=bad"):
                pass
        assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION

    @pytest.mark.asyncio
    async def test_requires_token(
        self,
        client: TestClient,
    ):
        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect("/users/events"):
                pass
        assert exc_info.value.code == status.WS_1008_POLICY_VIOLATION
