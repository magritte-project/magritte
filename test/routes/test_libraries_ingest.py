from random import randint

import pytest
from faker import Faker
from fastapi.testclient import TestClient

from conftest import SignIn


class TestIngestSongs:
    @pytest.mark.asyncio
    async def test_ingest(
        self,
        client: TestClient,
        faker: Faker,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        artist_name = faker.name()
        album_title = faker.word()
        artwork = {
            "kind": "front_cover",
            "image_url": faker.image_url(),
            "background_color": faker.hex_color(),
            "primary_color": faker.hex_color(),
            "secondary_color": faker.hex_color(),
            "tertiary_color": faker.hex_color(),
        }
        source = {
            "url": faker.url(),
            "mime_type": faker.mime_type("audio"),
            "extension_manifest_id": None,
            "extension_tag": None,
        }

        # It should ingest songs, including their submodels
        first_response = client.post(
            "/libraries/2/ingest/songs",
            json={
                "songs": [
                    {
                        "artist_name": artist_name,
                        "album_title": album_title,
                        "artworks": [artwork],
                        "sources": [source],
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
                        "comment": "TestIngestSongs",
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
        first_response_json = first_response.json()
        assert first_response.status_code == 200
        assert len(first_response_json) == 1
        assert first_response_json[0].get("id") is not None
        assert first_response_json[0].get("artist_id") is not None
        assert first_response_json[0].get("album_id") is not None
        assert len(first_response_json[0].get("artworks")) == 1
        assert len(first_response_json[0].get("sources")) == 1

        # It should deduplicate album, artist, artwork, and source
        second_response = client.post(
            "/libraries/2/ingest/songs",
            json={
                "songs": [
                    {
                        "artist_name": artist_name,
                        "album_title": album_title,
                        "artworks": [artwork],
                        "sources": [source],
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
                        "comment": "TestIngestSongs",
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
        second_response_json = second_response.json()
        assert second_response.status_code == 200
        assert len(second_response_json) == 1
        assert second_response_json[0].get("id") != first_response_json[0].get("id")
        assert second_response_json[0].get("artist_id") == first_response_json[0].get(
            "artist_id"
        )
        assert second_response_json[0].get("album_id") == first_response_json[0].get(
            "album_id"
        )
        assert len(second_response_json[0].get("artworks")) == 1
        assert second_response_json[0].get("artworks")[0].get(
            "id"
        ) == first_response_json[0].get("artworks")[0].get("id")
        assert len(second_response_json[0].get("sources")) == 1
        assert second_response_json[0].get("sources")[0].get(
            "id"
        ) == first_response_json[0].get("sources")[0].get("id")

    @pytest.mark.asyncio
    async def test_deduplicates_artists_and_albums_across_libraries(
        self,
        client: TestClient,
        faker: Faker,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        # Before, create a first library
        create_response_1 = client.post(
            "/libraries/create",
            json={
                "name": faker.name(),
                "home_path": None,
                "uploads_enabled": False,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response_1.status_code == 200
        library_id_1 = create_response_1.json()["id"]

        # Before, create a second library
        create_response_2 = client.post(
            "/libraries/create",
            json={
                "name": faker.name(),
                "home_path": None,
                "uploads_enabled": False,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response_2.status_code == 200
        library_id_2 = create_response_2.json()["id"]

        artist_name = faker.name()
        album_title = faker.word()
        artwork = {
            "kind": "front_cover",
            "image_url": faker.image_url(),
            "background_color": faker.hex_color(),
            "primary_color": faker.hex_color(),
            "secondary_color": faker.hex_color(),
            "tertiary_color": faker.hex_color(),
        }
        source = {
            "url": faker.url(),
            "mime_type": faker.mime_type("audio"),
            "extension_manifest_id": None,
            "extension_tag": None,
        }

        # It should ingest songs, including their submodels
        first_response = client.post(
            f"/libraries/{library_id_1}/ingest/songs",
            json={
                "songs": [
                    {
                        "artist_name": artist_name,
                        "album_title": album_title,
                        "artworks": [artwork],
                        "sources": [source],
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
                        "comment": "TestIngestSongs",
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
        first_response_json = first_response.json()
        assert first_response.status_code == 200
        assert len(first_response_json) == 1
        assert first_response_json[0].get("id") is not None
        assert first_response_json[0].get("artist_id") is not None
        assert first_response_json[0].get("album_id") is not None
        assert len(first_response_json[0].get("artworks")) == 1
        assert len(first_response_json[0].get("sources")) == 1

        # It should deduplicate album, artist, artwork, and source
        second_response = client.post(
            f"/libraries/{library_id_2}/ingest/songs",
            json={
                "songs": [
                    {
                        "artist_name": artist_name,
                        "album_title": album_title,
                        "artworks": [artwork],
                        "sources": [source],
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
                        "comment": "TestIngestSongs",
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
        second_response_json = second_response.json()
        assert second_response.status_code == 200
        assert len(second_response_json) == 1
        assert second_response_json[0].get("id") != first_response_json[0].get("id")
        assert second_response_json[0].get("artist_id") == first_response_json[0].get(
            "artist_id"
        )
        assert second_response_json[0].get("album_id") == first_response_json[0].get(
            "album_id"
        )
        assert len(second_response_json[0].get("artworks")) == 1
        assert second_response_json[0].get("artworks")[0].get(
            "id"
        ) == first_response_json[0].get("artworks")[0].get("id")
        assert len(second_response_json[0].get("sources")) == 1
        assert second_response_json[0].get("sources")[0].get(
            "id"
        ) == first_response_json[0].get("sources")[0].get("id")

    @pytest.mark.asyncio
    async def test_requires_library_add_permission(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.post(
            "/libraries/1/ingest/songs",
            json={
                "songs": [],
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
            "/libraries/99999999/ingest/songs",
            json={
                "songs": [],
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"
