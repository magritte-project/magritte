import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient

from conftest import SignIn


@pytest_asyncio.fixture
async def throwaway_song(
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
                    "album_title": None,
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
    return response.json()[0].get("id")


class TestReadLibrarySong:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("test", "password")

        response = client.get(
            f"/libraries/2/songs/{throwaway_song}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") == throwaway_song

    @pytest.mark.asyncio
    async def test_requires_library_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("orphaned", "password")

        response = client.get(
            f"/libraries/2/songs/{throwaway_song}",
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
            "/libraries/99999999/songs/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_song_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.get(
            "/libraries/2/songs/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Song not found"


class TestUpdateLibrarySong:
    @pytest.mark.asyncio
    async def test_update(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            f"/libraries/2/songs/{throwaway_song}",
            json={
                "end_time": 120,
                "title": "A treatise on the value of unit testing",
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("end_time") == 120
        assert response_json.get("title") == "A treatise on the value of unit testing"

    @pytest.mark.asyncio
    async def test_requires_library_edit_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("unlucky", "password")

        response = client.patch(
            f"/libraries/2/songs/{throwaway_song}",
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
            "/libraries/99999999/songs/9999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_song_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.patch(
            "/libraries/2/songs/9999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Song not found"


def _ingestable_song(faker: Faker, source_url: str) -> dict:
    return {
        "artist_name": None,
        "album_title": None,
        "artworks": [],
        "sources": [{"url": source_url, "mime_type": None}],
        "start_time": 0,
        "end_time": 0,
        "title": faker.sentence(nb_words=3),
        "album_artist": None,
        "composer": None,
        "genre": None,
        "release_date": None,
        "track_number": 1,
        "track_total": 1,
        "disc_number": 1,
        "disc_total": 1,
        "lyrics": None,
        "rating": None,
        "bpm": None,
        "comment": "TestLookupLibrarySongSources",
        "grouping": None,
        "mcn": None,
        "isrc": None,
        "music_brainz_release_id": None,
        "music_brainz_recording_id": None,
    }


class TestLookupLibrarySongSources:
    @pytest.mark.asyncio
    async def test_lookup(
        self,
        client: TestClient,
        sign_in: SignIn,
        faker: Faker,
    ):
        session = sign_in("test", "password")
        present_url = f"test:///{faker.uuid4()}"
        missing_url = f"test:///{faker.uuid4()}"

        ingest_response = client.post(
            "/libraries/2/ingest/songs",
            json={"songs": [_ingestable_song(faker, present_url)]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert ingest_response.status_code == 200

        # It should only return the URLs of songs in the library
        response = client.post(
            "/libraries/2/songs/sources",
            json={"urls": [present_url, missing_url]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert response.json() == {"urls": [present_url]}

    @pytest.mark.asyncio
    async def test_scoped_to_library(
        self,
        client: TestClient,
        sign_in: SignIn,
        faker: Faker,
    ):
        session = sign_in("test", "password")
        url = f"test:///{faker.uuid4()}"

        # Before, create another library
        create_response = client.post(
            "/libraries/create",
            json={
                "name": faker.name(),
                "home_path": None,
                "uploads_enabled": False,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        other_library_id = create_response.json()["id"]

        ingest_response = client.post(
            "/libraries/2/ingest/songs",
            json={"songs": [_ingestable_song(faker, url)]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert ingest_response.status_code == 200

        # It should not return URLs of songs which are only in other libraries
        response = client.post(
            f"/libraries/{other_library_id}/songs/sources",
            json={"urls": [url]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert response.json() == {"urls": []}

    @pytest.mark.asyncio
    async def test_requires_library_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("orphaned", "password")

        response = client.post(
            "/libraries/2/songs/sources",
            json={"urls": []},
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
            "/libraries/99999999/songs/sources",
            json={"urls": []},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"


class TestDeleteLibrarySong:
    @pytest.mark.asyncio
    async def test_delete(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            f"/libraries/2/songs/{throwaway_song}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_requires_library_remove_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("unlucky", "password")

        response = client.patch(
            f"/libraries/2/songs/{throwaway_song}",
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

        response = client.delete(
            "/libraries/99999999/songs/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_song_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            "/libraries/2/songs/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Song not found"
