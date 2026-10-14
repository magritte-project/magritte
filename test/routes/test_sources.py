from datetime import datetime
from random import randint

import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient

from conftest import AuthFixture
from magritte.model.source import Source


@pytest_asyncio.fixture
async def throwaway_source(
    client: TestClient,
    admin_auth: AuthFixture,
    faker: Faker,
) -> int:
    session = admin_auth.sign_in()

    response = client.post(
        "/sources/create",
        json={
            "url": faker.url(),
            "mime_type": faker.mime_type("audio"),
            "extension_manifest_id": None,
            "extension_tag": None,
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    return response.json().get("id")


class TestCreateSource:
    def test_create(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        response = client.post(
            "/sources/create",
            json={
                "url": "about:blank",
                "mime_type": None,
                "extension_manifest_id": None,
                "extension_tag": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") is not None
        assert response_json.get("url") == "about:blank"
        assert response_json.get("mime_type") is None
        assert response_json.get("is_invalid") is False
        assert response_json.get("extension_manifest_id") is None
        assert response_json.get("extension_tag") is None

    def test_handles_duplication(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        first_response = client.post(
            "/sources/create",
            json={
                "url": "about:blank",
                "mime_type": None,
                "extension_manifest_id": None,
                "extension_tag": None,
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
                "extension_manifest_id": None,
                "extension_tag": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        second_response_json = second_response.json()
        assert second_response.status_code == 200
        assert second_response_json.get("id") == first_response_json.get("id")
        assert second_response_json.get("url") == first_response_json.get("url")
        assert second_response_json.get("mime_type") == "application/null"
        assert second_response_json.get("is_invalid") is False
        assert second_response_json.get("extension_manifest_id") is None
        assert second_response_json.get("extension_tag") is None

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.post(
            "/sources/create",
            json={
                "url": "about:blank",
                "mime_type": None,
                "extension_manifest_id": None,
                "extension_tag": None,
            },
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestUpdateSource:
    def test_update(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        throwaway_source: int,
    ):
        session = admin_auth.sign_in()
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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
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
        admin_auth: AuthFixture,
        throwaway_source: int,
    ):
        session = admin_auth.sign_in()
        response = client.delete(
            f"/sources/{throwaway_source}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    def test_requires_source_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.get(
            "/sources/99999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Source not found"


class TestReadAllSources:
    def test_with_library_id(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
    ):
        session = admin_auth.sign_in()

        create_library_response = client.post(
            "/libraries/create",
            json={
                "name": faker.word(),
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_library_response.status_code == 200
        library_id = create_library_response.json().get("id")

        create_response = client.post(
            f"/libraries/{library_id}/ingest/songs",
            json={
                "songs": [
                    {
                        "artist_name": faker.name(),
                        "album_title": faker.word(),
                        "artworks": [],
                        "sources": [
                            {
                                "url": faker.url(),
                                "mime_type": faker.mime_type("audio"),
                                "extension_manifest_id": "magritte.test",
                                "extension_tag": "abc123",
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
                        "comment": "TestReadAllSources",
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
        assert create_response.status_code == 200

        read_response = client.get(
            f"/sources/all?library_id={library_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        read_json = read_response.json()
        assert read_response.status_code == 200
        assert read_json.get("total") == 1
        assert any(
            source.get("extension_tag") == "abc123" for source in read_json.get("items")
        )

    def test_with_extension_manifest_id(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
        throwaway_source: int,
    ):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/sources/create",
            json={
                "url": faker.url(),
                "mime_type": faker.mime_type("audio"),
                "extension_manifest_id": "magritte.test",
                "extension_tag": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        throwaway_source_with_extension = create_response.json().get("id")

        read_response = client.get(
            "/sources/all?extension_manifest_id=magritte.test",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        read_json = read_response.json()
        assert read_response.status_code == 200
        assert read_json.get("total") == 1
        assert any(
            source.get("id") == throwaway_source_with_extension
            for source in read_json.get("items")
        )
        assert not any(
            source.get("id") == throwaway_source for source in read_json.get("items")
        )

    def test_with_extension_tags(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
        throwaway_source: int,
    ):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/sources/create",
            json={
                "url": faker.url(),
                "mime_type": faker.mime_type("audio"),
                "extension_manifest_id": "magritte.test",
                "extension_tag": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        throwaway_source_with_extension = create_response.json().get("id")

        create_response = client.post(
            "/sources/create",
            json={
                "url": faker.url(),
                "mime_type": faker.mime_type("audio"),
                "extension_manifest_id": "magritte.test",
                "extension_tag": "abc123",
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        throwaway_source_with_extension_and_tag = create_response.json().get("id")

        read_response = client.get(
            "/sources/all?extension_tags=abc123",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        read_json = read_response.json()
        assert read_response.status_code == 200
        assert read_json.get("total") == 1
        assert any(
            source.get("id") == throwaway_source_with_extension_and_tag
            for source in read_json.get("items")
        )
        assert not any(
            source.get("id") == throwaway_source_with_extension
            for source in read_json.get("items")
        )
        assert not any(
            source.get("id") == throwaway_source for source in read_json.get("items")
        )

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get("/sources/all")
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


def ingest_library_sources(
    client: TestClient,
    auth: AuthFixture,
    faker: Faker,
    source_count: int,
) -> list[int]:
    session = auth.sign_in()

    create_library_response = client.post(
        "/libraries/create",
        json={
            "name": faker.word(),
            "home_path": None,
            "uploads_enabled": False,
            "cover_artwork": None,
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert create_library_response.status_code == 200
    library_id = create_library_response.json().get("id")

    ingest_response = client.post(
        f"/libraries/{library_id}/ingest/songs",
        json={
            "songs": [
                {
                    "artist_name": faker.name(),
                    "album_title": faker.word(),
                    "artworks": [],
                    "sources": [
                        {
                            "url": faker.unique.url(),
                            "mime_type": faker.mime_type("audio"),
                            "extension_manifest_id": None,
                            "extension_tag": None,
                        }
                        for _ in range(source_count)
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
                    "comment": "TestReadSourceChanges",
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
    assert ingest_response.status_code == 200

    read_response = client.get(
        f"/sources/all?library_id={library_id}",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert read_response.status_code == 200
    source_ids = [source.get("id") for source in read_response.json().get("items")]
    assert len(source_ids) == source_count
    return source_ids


class TestReadSourceChanges:
    @pytest.mark.asyncio
    async def test_with_since(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
    ):
        stale_source_id, fresh_source_id = ingest_library_sources(
            client, admin_auth, faker, source_count=2
        )
        async with admin_auth.db_session() as db_session:
            stale_source = await db_session.get_one(Source, stale_source_id)
            stale_source.last_updated = datetime(2001, 1, 1)
            fresh_source = await db_session.get_one(Source, fresh_source_id)
            fresh_source.last_updated = datetime(2020, 1, 1)
        session = admin_auth.sign_in()

        response = client.get(
            "/sources/changes",
            params={"since": "2010-01-01T00:00:00Z"},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("ids") == [fresh_source_id]

    def test_with_ids(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
    ):
        first_source_id, second_source_id = ingest_library_sources(
            client, admin_auth, faker, source_count=2
        )
        session = admin_auth.sign_in()

        response = client.get(
            "/sources/changes",
            params={"since": "2000-01-01T00:00:00Z", "ids": [first_source_id]},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("ids") == [first_source_id]
        assert second_source_id not in response_json.get("ids")

    def test_includes_only_user_accessible_sources(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        standard_auth: AuthFixture,
        faker: Faker,
    ):
        (admin_source_id,) = ingest_library_sources(
            client, admin_auth, faker, source_count=1
        )

        admin_session = admin_auth.sign_in()
        admin_response = client.get(
            "/sources/changes",
            params={"since": "2000-01-01T00:00:00Z"},
            headers={"Authorization": f"Bearer {admin_session.access_token}"},
        )
        assert admin_response.status_code == 200
        assert admin_source_id in admin_response.json().get("ids")

        standard_session = standard_auth.sign_in()
        standard_response = client.get(
            "/sources/changes",
            params={"since": "2000-01-01T00:00:00Z"},
            headers={"Authorization": f"Bearer {standard_session.access_token}"},
        )
        assert standard_response.status_code == 200
        assert admin_source_id not in standard_response.json().get("ids")

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get("/sources/changes?since=2000-01-01T00:00:00Z")
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


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
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.post(
            "/users/files/preflight",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        token = response.json().get("token")
        assert token is not None

        response = client.get(
            f"/sources/99999999/file?token={token}",
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Source not found"
