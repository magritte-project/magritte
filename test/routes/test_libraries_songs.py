import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from conftest import SignIn
from magritte.model.ignored_resource import IgnoredResource


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
    async def test_with_suppress_source_file(
        self,
        client: TestClient,
        sign_in: SignIn,
        faker: Faker,
        db_session: AsyncSession,
    ):
        session = sign_in("test", "password")

        mock_source_url = faker.url()
        response = client.post(
            "/libraries/2/ingest/songs",
            json={
                "songs": [
                    {
                        "artist_name": None,
                        "album_title": None,
                        "artworks": [],
                        "sources": [
                            {
                                "url": mock_source_url,
                                "mime_type": None,
                                "extension_manifest_id": None,
                                "extension_tag": None,
                            }
                        ],
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
                        "comment": "test_with_suppress_source_file",
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
        song_id = response.json()[0].get("id")

        response = client.delete(
            f"/libraries/2/songs/{song_id}?suppress_source_file=true",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

        assert await IgnoredResource.exists(
            where=[col(IgnoredResource.url) == mock_source_url],
            joins=[],
            session=db_session,
        ), "It should add song source to the ignored resources table"

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
