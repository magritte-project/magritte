import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient

from conftest import SignIn


@pytest_asyncio.fixture
async def throwaway_artist(
    client: TestClient,
    sign_in: SignIn,
    faker: Faker,
) -> int:
    session = sign_in("test", "password")

    response = client.post(
        "/libraries/2/artists/create",
        json={
            "name": faker.name(),
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    return response.json().get("id")


class TestCreateLibraryArtist:
    @pytest.mark.asyncio
    async def test_create(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/2/artists/create",
            json={"name": "I am the greatest of all time"},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("name") == "I am the greatest of all time"

    @pytest.mark.asyncio
    async def test_requires_library_add_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/1/artists/create",
            json={"name": "I am the greatest of all time"},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_library_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/99999999/artists/create",
            json={"name": "I am the greatest of all time"},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"


class TestUpdateLibraryArtist:
    @pytest.mark.asyncio
    async def test_update(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_artist: int,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            f"/libraries/2/artists/{throwaway_artist}",
            json={"name": "I am the greatest of all time"},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("name") == "I am the greatest of all time"

    @pytest.mark.asyncio
    async def test_requires_library_edit_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_artist: int,
    ):
        session = sign_in("unlucky", "password")

        response = client.patch(
            f"/libraries/2/artists/{throwaway_artist}",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_library_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            "/libraries/99999999/artists/9999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_artist_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            "/libraries/2/artists/9999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Artist not found"


class TestDeleteLibraryArtist:
    @pytest.mark.asyncio
    async def test_delete(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_artist: int,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            f"/libraries/2/artists/{throwaway_artist}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_requires_library_remove_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_artist: int,
    ):
        session = sign_in("unlucky", "password")

        response = client.delete(
            f"/libraries/2/artists/{throwaway_artist}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_library_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            "/libraries/99999999/artists/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_artist_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            "/libraries/2/artists/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Artist not found"
