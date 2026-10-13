import pytest
from faker import Faker
from fastapi.testclient import TestClient

from conftest import AuthFixture
from magritte.schemas.user import Token


def _ingest_song_with_source(
    client: TestClient,
    session: Token,
    library_id: int,
    faker: Faker,
    comment: str,
) -> tuple[int, str]:
    source_url = faker.url()
    ingest_response = client.post(
        f"/libraries/{library_id}/ingest/songs",
        json={
            "songs": [
                {
                    "artist_name": None,
                    "album_title": None,
                    "artworks": [],
                    "sources": [
                        {
                            "url": source_url,
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
                    "comment": comment,
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
    song_id = ingest_response.json()[0].get("id")

    delete_response = client.delete(
        f"/libraries/{library_id}/songs/{song_id}?suppress_source_file=true",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert delete_response.status_code == 200

    return song_id, source_url


def test_create_and_read_library(client: TestClient, admin_auth: AuthFixture):
    session = admin_auth.sign_in()

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_create_and_read_library",
            "home_path": None,
            "uploads_enabled": False,
            "cover_artwork": None,
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    create_json = create_response.json()
    assert create_response.status_code == 200
    assert create_json.get("id") is not None
    assert create_json.get("name") == "test_create_and_read_library"
    library_id = create_json.get("id")

    read_response = client.get(
        f"/libraries/{library_id}",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    read_json = read_response.json()
    assert read_response.status_code == 200
    assert read_json.get("id") == library_id
    assert read_json.get("name") == "test_create_and_read_library"
    assert read_json.get("home_path") is None


def test_create_rejects_absolute_home_paths(
    client: TestClient, admin_auth: AuthFixture
):
    session = admin_auth.sign_in()

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_create_rejects_absolute_home_paths",
            "home_path": "/",
            "uploads_enabled": False,
            "cover_artwork": None,
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert create_response.status_code == 422


def test_read_library_requires_library_to_exist(
    client: TestClient, admin_auth: AuthFixture
):
    session = admin_auth.sign_in()

    read_response = client.get(
        "/libraries/999999",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert read_response.status_code == 404
    assert read_response.json().get("detail") == "Library not found"


def test_read_library_requires_permission(
    client: TestClient,
    admin_auth: AuthFixture,
    fresh_admin_auth: AuthFixture,
):
    creator_session = admin_auth.sign_in()

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_read_library_requires_permission",
            "home_path": None,
            "uploads_enabled": False,
            "cover_artwork": None,
        },
        headers={"Authorization": f"Bearer {creator_session.access_token}"},
    )
    assert create_response.status_code == 200
    library_id = create_response.json().get("id")

    forbidden_session = fresh_admin_auth.sign_in()

    read_response = client.get(
        f"/libraries/{library_id}",
        headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
    )
    assert read_response.status_code == 404
    assert read_response.json().get("detail") == "Library not found"


def test_read_library_home_subpaths_requires_relative_path(
    client: TestClient, admin_auth: AuthFixture
):
    session = admin_auth.sign_in()

    response = client.get(
        "/libraries/home-subpaths?relative_to=/",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert response.status_code == 400
    assert response.json().get("detail") == "relative_to not relative"


def test_read_library_home_subpaths_requires_libraries_write_scope(
    client: TestClient, standard_auth: AuthFixture
):
    session = standard_auth.sign_in()

    response = client.get(
        "/libraries/home-subpaths?relative_to=.",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert response.status_code == 401


class TestUpdateLibrary:
    def test_update(self, client: TestClient, admin_auth: AuthFixture):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibrary::test_update",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        update_response = client.patch(
            f"/libraries/{library_id}",
            json={
                "name": "And now for something completely different",
                "uploads_enabled": True,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        update_json = update_response.json()
        assert update_response.status_code == 200
        assert update_json.get("id") == library_id
        assert update_json.get("name") == "And now for something completely different"
        assert update_json.get("uploads_enabled") is True

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        read_json = read_response.json()
        assert read_response.status_code == 200
        assert read_json.get("name") == "And now for something completely different"
        assert read_json.get("uploads_enabled") is True

    def test_read_library_requires_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "test_read_library_requires_permission",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = fresh_admin_auth.sign_in()

        update_response = client.patch(
            f"/libraries/{library_id}",
            json={},
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert update_response.status_code == 404
        assert update_response.json().get("detail") == "Library not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.patch(
            "/libraries/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadLibraryPermissions:
    def test_read(self, client: TestClient, admin_auth: AuthFixture):
        session = admin_auth.sign_in()

        response = client.get(
            "/libraries/1/permissions",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert any(
            permission.get("user_id") == 1 and permission.get("username") == "admin"
            for permission in response_json
        )

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/libraries/1/permissions",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_requires_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestReadLibraryPermissions::test_requires_permission",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = fresh_admin_auth.sign_in()

        read_response = client.get(
            f"/libraries/{library_id}/permissions",
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert read_response.status_code == 404
        assert read_response.json().get("detail") == "Library not found"


class TestCreateLibraryPermission:
    @pytest.mark.asyncio
    async def test_create(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestCreateLibraryPermission::test_create",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        create_response = client.post(
            f"/libraries/{library_id}/permission/create",
            json={
                "user_id": await fresh_admin_auth.user_id,
                "can_add": False,
                "can_edit": True,
                "can_remove": False,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        assert create_response.json().get("can_edit") is True

        other_session = fresh_admin_auth.sign_in()

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {other_session.access_token}"},
        )
        assert read_response.status_code == 200

    def test_requires_user_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestCreateLibraryPermission::test_requires_user_to_exist",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        create_response = client.post(
            f"/libraries/{library_id}/permission/create",
            json={
                "user_id": 999999,
                "can_add": False,
                "can_edit": False,
                "can_remove": False,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 404
        assert create_response.json().get("detail") == "User not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.post(
            "/libraries/1/permission/create",
            json={
                "user_id": 2,
                "can_add": False,
                "can_edit": False,
                "can_remove": False,
            },
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_requires_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestCreateLibraryPermission::test_requires_permission",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = fresh_admin_auth.sign_in()

        create_response = client.post(
            f"/libraries/{library_id}/permission/create",
            json={
                "user_id": 2,
                "can_add": False,
                "can_edit": False,
                "can_remove": False,
            },
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert create_response.status_code == 404
        assert create_response.json().get("detail") == "Library not found"


class TestUpdateLibraryPermission:
    @pytest.mark.asyncio
    async def test_update(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        create_response = client.post(
            f"/libraries/{library_id}/permission/create",
            json={
                "user_id": await fresh_admin_auth.user_id,
                "can_add": False,
                "can_edit": False,
                "can_remove": False,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        assert create_response.json().get("can_edit") is False

        update_response = client.patch(
            f"/libraries/{library_id}/permission/{await fresh_admin_auth.user_id}",
            json={"can_edit": True},
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert update_response.status_code == 200
        assert update_response.json().get("can_edit") is True

        other_session = fresh_admin_auth.sign_in()

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {other_session.access_token}"},
        )
        assert read_response.status_code == 200

    def test_rejects_current_user(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        read_response = client.patch(
            f"/libraries/{library_id}/permission/1",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert read_response.status_code == 400
        assert read_response.json().get("detail") == "Cannot update yourself"

    def test_requires_user_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_requires_user_to_exist",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        read_response = client.patch(
            f"/libraries/{library_id}/permission/999999",
            json={"can_edit": True},
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert read_response.status_code == 404
        assert read_response.json().get("detail") == "User not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.patch(
            "/libraries/1/permission/2",
            json={},
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_requires_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_requires_permission",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = fresh_admin_auth.sign_in()

        update_response = client.patch(
            f"/libraries/{library_id}/permission/2",
            json={},
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert update_response.status_code == 404
        assert update_response.json().get("detail") == "Library not found"


class TestDeleteLibraryPermission:
    def test_delete(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        create_response = client.post(
            f"/libraries/{library_id}/permission/create",
            json={
                "user_id": 2,
                "can_add": False,
                "can_edit": False,
                "can_remove": False,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        assert create_response.json().get("can_edit") is False

        delete_response = client.delete(
            f"/libraries/{library_id}/permission/2",
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert delete_response.status_code == 200

        other_session = fresh_admin_auth.sign_in()

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {other_session.access_token}"},
        )
        assert read_response.status_code == 404

    def test_rejects_current_user(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        read_response = client.delete(
            f"/libraries/{library_id}/permission/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert read_response.status_code == 400
        assert read_response.json().get("detail") == "Cannot delete yourself"

    def test_requires_user_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_requires_user_to_exist",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        read_response = client.delete(
            f"/libraries/{library_id}/permission/999999",
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert read_response.status_code == 404
        assert read_response.json().get("detail") == "Permission not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.delete(
            "/libraries/1/permission/2",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_requires_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestDeleteLibraryPermissions::test_requires_permission",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = fresh_admin_auth.sign_in()

        delete_response = client.delete(
            f"/libraries/{library_id}/permission/2",
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert delete_response.status_code == 404
        assert delete_response.json().get("detail") == "Library not found"


class TestReadLibraryIgnoredResources:
    def test_read(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
    ):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestReadLibraryIgnoredResources::test_read",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        _, source_url = _ingest_song_with_source(
            client,
            session,
            library_id,
            faker,
            "TestReadLibraryIgnoredResources::test_read",
        )

        read_response = client.get(
            f"/libraries/{library_id}/ignored",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        read_json = read_response.json()
        assert read_response.status_code == 200
        assert read_json.get("total") == 1
        assert any(item.get("url") == source_url for item in read_json.get("items"))

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get(
            "/libraries/1/ignored",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_requires_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestReadLibraryIgnoredResources::test_requires_permission",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = fresh_admin_auth.sign_in()

        read_response = client.get(
            f"/libraries/{library_id}/ignored",
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert read_response.status_code == 404
        assert read_response.json().get("detail") == "Library not found"


class TestDeleteLibraryIgnoredResource:
    def test_delete(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
    ):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestDeleteLibraryIgnoredResource::test_delete",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        _ingest_song_with_source(
            client,
            session,
            library_id,
            faker,
            "TestDeleteLibraryIgnoredResource::test_delete",
        )

        read_response = client.get(
            f"/libraries/{library_id}/ignored",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert read_response.status_code == 200
        ignored_resource_id = read_response.json().get("items")[0].get("id")

        delete_response = client.delete(
            f"/libraries/{library_id}/ignored/{ignored_resource_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert delete_response.status_code == 200

        read_response = client.get(
            f"/libraries/{library_id}/ignored",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert read_response.status_code == 200
        assert read_response.json().get("total") == 0

    def test_requires_resource_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestDeleteLibraryIgnoredResource::test_requires_resource_to_exist",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        delete_response = client.delete(
            f"/libraries/{library_id}/ignored/999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert delete_response.status_code == 404
        assert delete_response.json().get("detail") == "Ignored resource not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.delete(
            "/libraries/1/ignored/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"

    def test_requires_permission(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fresh_admin_auth: AuthFixture,
    ):
        creator_session = admin_auth.sign_in()

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestDeleteLibraryIgnoredResource::test_requires_permission",
                "home_path": None,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = fresh_admin_auth.sign_in()

        delete_response = client.delete(
            f"/libraries/{library_id}/ignored/1",
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert delete_response.status_code == 404
        assert delete_response.json().get("detail") == "Library not found"
