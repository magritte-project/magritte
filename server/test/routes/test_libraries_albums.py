import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient

from conftest import SignIn


class TestCreateLibraryAlbum:
    @pytest.mark.asyncio
    async def test_create(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/2/albums/create",
            json={
                "title": "Smoothest of Jams",
                "artist_id": None,
                "artwork_ids": [],
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("title") == "Smoothest of Jams"

    @pytest.mark.asyncio
    async def test_requires_library_add_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/1/albums/create",
            json={
                "title": "Smoothest of Jams",
                "artist_id": None,
                "artwork_ids": [],
            },
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
            "/libraries/99999999/albums/create",
            json={
                "title": "Smoothest of Jams",
                "artist_id": None,
                "artwork_ids": [],
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"


class TestUpdateLibraryAlbum:
    @pytest_asyncio.fixture
    async def throwaway_album(
        self,
        client: TestClient,
        sign_in: SignIn,
        faker: Faker,
    ) -> int:
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/2/albums/create",
            json={
                "title": faker.sentence(nb_words=2),
                "artist_id": None,
                "artwork_ids": [],
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        return response.json().get("id")

    @pytest.mark.asyncio
    async def test_update(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_album: int,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            f"/libraries/2/albums/{throwaway_album}",
            json={"title": "Smoothest of Jams"},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("title") == "Smoothest of Jams"

    @pytest.mark.asyncio
    async def test_requires_library_edit_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_album: int,
    ):
        session = sign_in("unlucky", "password")

        response = client.patch(
            f"/libraries/2/albums/{throwaway_album}",
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
            "/libraries/99999999/albums/9999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_album_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            "/libraries/2/albums/9999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Album not found"
