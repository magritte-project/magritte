import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient

from conftest import SignIn


@pytest_asyncio.fixture
async def throwaway_source(
    client: TestClient,
    sign_in: SignIn,
    faker: Faker,
) -> int:
    session = sign_in("test", "password")

    response = client.post(
        "/sources/create",
        json={
            "url": faker.url(),
            "mime_type": faker.mime_type("audio"),
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    return response.json().get("id")


class TestCreateSource:
    def test_create(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")
        response = client.post(
            "/sources/create",
            json={
                "url": "about:blank",
                "mime_type": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") is not None
        assert response_json.get("url") == "about:blank"
        assert response_json.get("mime_type") is None
        assert response_json.get("is_invalid") is False

    def test_handles_duplication(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")
        first_response = client.post(
            "/sources/create",
            json={
                "url": "about:blank",
                "mime_type": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        first_response_json = first_response.json()
        assert first_response.status_code == 200

        second_response = client.post(
            "/sources/create",
            json={
                "url": "about:blank",
                "mime_type": "application/null",
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        second_response_json = second_response.json()
        assert second_response.status_code == 200
        assert second_response_json.get("id") == first_response_json.get("id")
        assert second_response_json.get("url") == first_response_json.get("url")
        assert second_response_json.get("mime_type") == "application/null"
        assert second_response_json.get("is_invalid") is False

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.post(
            "/sources/create",
            json={
                "url": "about:blank",
                "mime_type": None,
            },
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestUpdateSource:
    def test_update(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_source: int,
    ):
        session = sign_in("test", "password")
        response = client.patch(
            f"/sources/{throwaway_source}",
            json={"url": "about:blank", "mime_type": None, "is_invalid": True},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") is not None
        assert response_json.get("url") == "about:blank"
        assert response_json.get("mime_type") is None
        assert response_json.get("is_invalid") is True

    def test_requires_source_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")
        response = client.patch(
            "/sources/99999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Source not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.patch(
            "/sources/1",
            json={},
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestDeleteSource:
    def test_delete(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_source: int,
    ):
        session = sign_in("test", "password")
        response = client.delete(
            f"/sources/{throwaway_source}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    def test_requires_source_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")
        response = client.delete(
            "/sources/99999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Source not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.delete(
            "/sources/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadSource:
    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get("/sources/1")
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_requires_source_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.get(
            "/sources/99999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Source not found"


class TestStreamSourceFile:
    def test_requires_valid_token(
        self,
        client: TestClient,
    ):
        response = client.get("/sources/1/file?token=123")
        assert response.status_code == 401
        assert response.json().get("detail") == "Could not validate credentials"

    def test_requires_source_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.get(
            f"/sources/99999999/file?token={session.access_token}",
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Source not found"
