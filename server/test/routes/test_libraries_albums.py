import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient

from conftest import SignIn


@pytest_asyncio.fixture
async def throwaway_album(
    client: TestClient,
    sign_in: SignIn,
    faker: Faker,
) -> int:
    session = sign_in("test", "password")

    response = client.post(
        "/libraries/2/ingest/songs",
        json={
            "songs": [
                {
                    "artist_name": None,
                    "album_title": faker.word(),
                    "artworks": [],
                    "sources": [],
                    "start_time": 0,
                    "end_time": 0,
                    "title": faker.sentence(nb_words=3),
                    "album_artist": None,
                    "composer": None,
                    "genre": None,
                    "release_date": None,
                    "track_number": 1,
                    "track_total": 10,
                    "disc_number": 1,
                    "disc_total": 1,
                    "lyrics": None,
                    "rating": None,
                    "bpm": None,
                    "comment": "throwaway_artist",
                    "grouping": None,
                    "mcn": None,
                    "isrc": None,
                    "music_brainz_release_id": None,
                    "music_brainz_recording_id": None,
                },
            ],
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert response.status_code == 200
    return response.json()[0].get("album_id")


class TestReadLibraryAlbum:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_album: int,
    ):
        session = sign_in("test", "password")

        response = client.get(
            f"/libraries/2/albums/{throwaway_album}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == throwaway_album

    @pytest.mark.asyncio
    async def test_requires_library_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_album: int,
    ):
        session = sign_in("orphaned", "password")

        response = client.get(
            f"/libraries/2/albums/{throwaway_album}",
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

        response = client.get(
            "/libraries/99999999/albums/9999999",
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

        response = client.get(
            "/libraries/2/albums/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Album not found"


class TestUpdateLibraryAlbum:
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


class TestDeleteLibraryAlbum:
    @pytest.mark.asyncio
    async def test_delete(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_album: int,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            f"/libraries/2/albums/{throwaway_album}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_requires_library_remove_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_album: int,
    ):
        session = sign_in("unlucky", "password")

        response = client.delete(
            f"/libraries/2/albums/{throwaway_album}",
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
            "/libraries/99999999/albums/9999999",
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

        response = client.delete(
            "/libraries/2/albums/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Album not found"
