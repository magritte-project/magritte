from random import randint

import pytest
from faker import Faker
from fastapi.testclient import TestClient

from conftest import AuthFixture


class TestIngestSongs:
    @pytest.mark.asyncio
    async def test_ingest(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

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
    async def test_deduplicates_within_a_batch(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

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

        # It should ingest multiple songs sharing a new album, artist, and artwork
        response = client.post(
            "/libraries/2/ingest/songs",
            json={
                "songs": [
                    {
                        "artist_name": artist_name,
                        "album_title": album_title,
                        "artworks": [artwork],
                        "sources": [
                            {
                                "url": faker.url(),
                                "mime_type": faker.mime_type("audio"),
                                "extension_manifest_id": None,
                                "extension_tag": None,
                            }
                        ],
                        "start_time": 0,
                        "end_time": randint(30, 300),
                        "title": faker.sentence(nb_words=3),
                        "album_artist": None,
                        "composer": None,
                        "genre": None,
                        "release_date": None,
                        "track_number": track_number,
                        "track_total": 3,
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
                    }
                    for track_number in range(1, 4)
                ],
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        response_json = response.json()
        assert len(response_json) == 3
        assert len({song.get("id") for song in response_json}) == 3
        assert len({song.get("artist_id") for song in response_json}) == 1
        assert len({song.get("album_id") for song in response_json}) == 1
        assert len({song.get("artworks")[0].get("id") for song in response_json}) == 1

    @pytest.mark.asyncio
    async def test_deduplicates_artists_and_albums_across_libraries(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        # Before, create a first library
        create_response_1 = client.post(
            "/libraries/create",
            json={
                "name": faker.name(),
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
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
                "cover_artwork": None,
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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.post(
            "/libraries/99999999/ingest/songs",
            json={
                "songs": [],
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"


def _create_library(client: TestClient, faker: Faker, access_token: str) -> int:
    response = client.post(
        "/libraries/create",
        json={
            "name": faker.name(),
            "home_path": None,
            "uploads_enabled": False,
            "cover_artwork": None,
        },
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    return response.json()["id"]


def _ingest_song(
    client: TestClient, faker: Faker, access_token: str, library_id: int
) -> dict:
    response = client.post(
        f"/libraries/{library_id}/ingest/songs",
        json={
            "songs": [
                {
                    "artist_name": faker.name(),
                    "album_title": faker.word(),
                    "artworks": [
                        {
                            "kind": "front_cover",
                            "image_url": faker.image_url(),
                            "background_color": faker.hex_color(),
                            "primary_color": faker.hex_color(),
                            "secondary_color": faker.hex_color(),
                            "tertiary_color": faker.hex_color(),
                        }
                    ],
                    "sources": [
                        {
                            "url": faker.url(),
                            "mime_type": faker.mime_type("audio"),
                            "extension_manifest_id": None,
                            "extension_tag": None,
                        }
                    ],
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
                    "comment": "TestIngestExistingSongs",
                    "grouping": None,
                    "mcn": None,
                    "isrc": None,
                    "music_brainz_release_id": None,
                    "music_brainz_recording_id": None,
                },
            ],
        },
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    return response.json()[0]


def _library_song_ids(client: TestClient, access_token: str, library_id: int) -> set:
    response = client.get(
        f"/libraries/{library_id}/songs",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert response.status_code == 200
    return {song["id"] for song in response.json()["items"]}


class TestIngestExistingSongs:
    @pytest.mark.asyncio
    async def test_ingest(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        source_library_id = _create_library(client, faker, session.access_token)
        target_library_id = _create_library(client, faker, session.access_token)
        song = _ingest_song(client, faker, session.access_token, source_library_id)

        # It should add the existing song to the library, including its submodels
        response = client.post(
            f"/libraries/{target_library_id}/ingest/songs/existing",
            json={"existing_song_ids": [song["id"]]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert len(response_json) == 1
        assert response_json[0].get("id") == song["id"]
        assert response_json[0].get("artist_id") == song["artist_id"]
        assert response_json[0].get("album_id") == song["album_id"]
        assert len(response_json[0].get("artworks")) == 1
        assert len(response_json[0].get("sources")) == 1

        # It should list the song in the new library without removing it from the old one
        assert _library_song_ids(client, session.access_token, target_library_id) == {
            song["id"]
        }
        assert _library_song_ids(client, session.access_token, source_library_id) == {
            song["id"]
        }

    @pytest.mark.asyncio
    async def test_ingest_song_already_in_library(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        library_id = _create_library(client, faker, session.access_token)
        song = _ingest_song(client, faker, session.access_token, library_id)

        # It should succeed without listing the song twice
        response = client.post(
            f"/libraries/{library_id}/ingest/songs/existing",
            json={"existing_song_ids": [song["id"]]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert [returned.get("id") for returned in response.json()] == [song["id"]]

        list_response = client.get(
            f"/libraries/{library_id}/songs",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert list_response.json()["total"] == 1

    @pytest.mark.asyncio
    async def test_ingest_duplicate_song_ids(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        source_library_id = _create_library(client, faker, session.access_token)
        target_library_id = _create_library(client, faker, session.access_token)
        song = _ingest_song(client, faker, session.access_token, source_library_id)

        # It should treat repeated ids as a single song
        response = client.post(
            f"/libraries/{target_library_id}/ingest/songs/existing",
            json={"existing_song_ids": [song["id"], song["id"]]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert [returned.get("id") for returned in response.json()] == [song["id"]]
        assert _library_song_ids(client, session.access_token, target_library_id) == {
            song["id"]
        }

    @pytest.mark.asyncio
    async def test_ingest_song_in_multiple_libraries(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        first_library_id = _create_library(client, faker, session.access_token)
        second_library_id = _create_library(client, faker, session.access_token)
        target_library_id = _create_library(client, faker, session.access_token)
        song = _ingest_song(client, faker, session.access_token, first_library_id)

        # Before, add the song to a second library
        response = client.post(
            f"/libraries/{second_library_id}/ingest/songs/existing",
            json={"existing_song_ids": [song["id"]]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

        # It should find the song once even though it's in several of the user's libraries
        response = client.post(
            f"/libraries/{target_library_id}/ingest/songs/existing",
            json={"existing_song_ids": [song["id"]]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert [returned.get("id") for returned in response.json()] == [song["id"]]
        assert _library_song_ids(client, session.access_token, target_library_id) == {
            song["id"]
        }

    @pytest.mark.asyncio
    async def test_requires_access_to_songs(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        # Before, create a song in a library only the other admin can access
        other_session = fresh_admin_auth.sign_in()
        other_library_id = _create_library(client, faker, other_session.access_token)
        other_song = _ingest_song(
            client, faker, other_session.access_token, other_library_id
        )

        session = admin_auth.sign_in()
        target_library_id = _create_library(client, faker, session.access_token)

        response = client.post(
            f"/libraries/{target_library_id}/ingest/songs/existing",
            json={"existing_song_ids": [other_song["id"]]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Song not found"
        assert (
            _library_song_ids(client, session.access_token, target_library_id) == set()
        )

    @pytest.mark.asyncio
    async def test_requires_all_songs_to_exist(
        self,
        client: TestClient,
        faker: Faker,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        source_library_id = _create_library(client, faker, session.access_token)
        target_library_id = _create_library(client, faker, session.access_token)
        song = _ingest_song(client, faker, session.access_token, source_library_id)

        # It should reject the whole batch, leaving the library unchanged
        response = client.post(
            f"/libraries/{target_library_id}/ingest/songs/existing",
            json={"existing_song_ids": [song["id"], 99999999]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Song not found"
        assert (
            _library_song_ids(client, session.access_token, target_library_id) == set()
        )

    @pytest.mark.asyncio
    async def test_requires_library_add_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.post(
            "/libraries/1/ingest/songs/existing",
            json={"existing_song_ids": []},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"

    @pytest.mark.asyncio
    async def test_requires_library_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.post(
            "/libraries/99999999/ingest/songs/existing",
            json={"existing_song_ids": []},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Library not found"
