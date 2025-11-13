from random import randint

import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient

from conftest import SignIn


class TestCreateLibrarySong:
    @pytest.mark.asyncio
    async def test_create(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/2/songs/create",
            json={
                "artist_id": None,
                "album_id": None,
                "artwork_ids": [],
                "source_ids": [],
                "start_time": 0,
                "end_time": 300,
                "title": "A treatise on the value of unit testing",
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
                "comment": "TestCreateLibrarySong",
                "grouping": None,
                "mcn": None,
                "isrc": None,
                "music_brainz_release_id": None,
                "music_brainz_recording_id": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("title") == "A treatise on the value of unit testing"
        assert response_json.get("track_number") == 1
        assert response_json.get("track_total") == 10
        assert response_json.get("disc_number") == 1
        assert response_json.get("disc_total") == 1
        assert response_json.get("comment") == "TestCreateLibrarySong"

    @pytest.mark.asyncio
    async def test_requires_library_add_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/1/songs/create",
            json={
                "artist_id": None,
                "album_id": None,
                "artwork_ids": [],
                "source_ids": [],
                "start_time": 0,
                "end_time": 0,
                "title": None,
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
                "comment": None,
                "grouping": None,
                "mcn": None,
                "isrc": None,
                "music_brainz_release_id": None,
                "music_brainz_recording_id": None,
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
            "/libraries/99999999/songs/create",
            json={
                "artist_id": None,
                "album_id": None,
                "artwork_ids": [],
                "source_ids": [],
                "start_time": 0,
                "end_time": 0,
                "title": None,
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
                "comment": None,
                "grouping": None,
                "mcn": None,
                "isrc": None,
                "music_brainz_release_id": None,
                "music_brainz_recording_id": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"


class TestUpdateLibrarySong:
    @pytest_asyncio.fixture
    async def throwaway_song(
        self,
        client: TestClient,
        sign_in: SignIn,
        faker: Faker,
    ) -> int:
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/2/songs/create",
            json={
                "artist_id": None,
                "album_id": None,
                "artwork_ids": [],
                "source_ids": [],
                "start_time": 0,
                "end_time": randint(30, 300),
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
                "comment": "TestUpdateLibrarySong",
                "grouping": None,
                "mcn": None,
                "isrc": None,
                "music_brainz_release_id": None,
                "music_brainz_recording_id": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        return response.json().get("id")

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
