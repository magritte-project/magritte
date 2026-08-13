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


class TestIngestPlaybackEvents:
    @pytest.mark.asyncio
    async def test_read(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/playback-events/ingest",
            json=[
                {
                    "kind": "play",
                    "song_id": throwaway_song,
                    "start_time": 0,
                    "end_time": 0,
                }
            ],
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("accepted_count") == 1
        assert response_json.get("rejected_events") == []

    @pytest.mark.asyncio
    async def test_requires_library_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_song: int,
    ):
        session = sign_in("orphaned", "password")

        response = client.post(
            "/playback-events/ingest",
            json=[
                {
                    "kind": "play",
                    "song_id": throwaway_song,
                    "start_time": 0,
                    "end_time": 0,
                }
            ],
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("accepted_count") == 0
        assert len(response_json.get("rejected_events")) == 1
        assert any(
            rejected_event.get("song_id") == throwaway_song
            for rejected_event in response_json.get("rejected_events")
        )

    @pytest.mark.asyncio
    async def test_requires_song_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/playback-events/ingest",
            json=[
                {
                    "kind": "play",
                    "song_id": 9999999,
                    "start_time": 0,
                    "end_time": 0,
                }
            ],
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("accepted_count") == 0
        assert len(response_json.get("rejected_events")) == 1
        assert any(
            rejected_event.get("song_id") == 9999999
            for rejected_event in response_json.get("rejected_events")
        )

    @pytest.mark.asyncio
    async def test_rejects_too_long_body(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/playback-events/ingest",
            json=[
                {
                    "kind": "play",
                    "song_id": i,
                    "start_time": 0,
                    "end_time": 0,
                }
                for i in range(51)
            ],
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 422
