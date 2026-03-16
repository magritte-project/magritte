from fastapi.testclient import TestClient

from conftest import SignIn


def test_create_and_read_library(client: TestClient, sign_in: SignIn):
    session = sign_in("test", "password")

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_create_and_read_library",
            "home_path": None,
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


def test_create_rejects_absolute_home_paths(client: TestClient, sign_in: SignIn):
    session = sign_in("test", "password")

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_create_rejects_absolute_home_paths",
            "home_path": "/",
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert create_response.status_code == 422


def test_read_library_requires_library_to_exist(client: TestClient, sign_in: SignIn):
    session = sign_in("test", "password")

    read_response = client.get(
        "/libraries/999999",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert read_response.status_code == 404
    assert read_response.json().get("detail") == "Library not found"


def test_read_library_requires_permission(client: TestClient, sign_in: SignIn):
    creator_session = sign_in("test", "password")

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_read_library_requires_permission",
            "home_path": None,
        },
        headers={"Authorization": f"Bearer {creator_session.access_token}"},
    )
    assert create_response.status_code == 200
    library_id = create_response.json().get("id")

    forbidden_session = sign_in("unlucky", "password")

    read_response = client.get(
        f"/libraries/{library_id}",
        headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
    )
    assert read_response.status_code == 404
    assert read_response.json().get("detail") == "Library not found"


def test_read_library_home_subpaths_requires_relative_path(
    client: TestClient, sign_in: SignIn
):
    session = sign_in("test", "password")

    response = client.get(
        "/libraries/home-subpaths?relative_to=/",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert response.status_code == 400
    assert response.json().get("detail") == "relative_to not relative"


def test_read_library_home_subpaths_requires_libraries_write_scope(
    client: TestClient, sign_in: SignIn
):
    session = sign_in("restricted", "password")

    response = client.get(
        "/libraries/home-subpaths?relative_to=.",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert response.status_code == 401


class TestUpdateLibrary:
    def test_update(self, client: TestClient, sign_in: SignIn):
        session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibrary::test_update",
                "home_path": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        update_response = client.patch(
            f"/libraries/{library_id}",
            json={
                "name": "And now for something completely different",
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        update_json = update_response.json()
        assert update_response.status_code == 200
        assert update_json.get("id") == library_id
        assert update_json.get("name") == "And now for something completely different"

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert read_response.status_code == 200
        assert (
            read_response.json().get("name")
            == "And now for something completely different"
        )

    def test_read_library_requires_permission(
        self, client: TestClient, sign_in: SignIn
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "test_read_library_requires_permission",
                "home_path": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = sign_in("unlucky", "password")

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
    def test_read(self, client: TestClient, sign_in: SignIn):
        session = sign_in("test", "password")

        response = client.get(
            "/libraries/1/permissions",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert any(
            permission.get("user_id") == 1 and permission.get("username") == "test"
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
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestReadLibraryPermissions::test_requires_permission",
                "home_path": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = sign_in("unlucky", "password")

        read_response = client.get(
            f"/libraries/{library_id}/permissions",
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert read_response.status_code == 404
        assert read_response.json().get("detail") == "Library not found"


class TestCreateLibraryPermission:
    def test_create(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestCreateLibraryPermission::test_create",
                "home_path": None,
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
                "can_edit": True,
                "can_remove": False,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        assert create_response.json().get("can_edit") is True

        other_session = sign_in("unlucky", "password")

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {other_session.access_token}"},
        )
        assert read_response.status_code == 200

    def test_requires_user_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestCreateLibraryPermission::test_requires_user_to_exist",
                "home_path": None,
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
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestCreateLibraryPermission::test_requires_permission",
                "home_path": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = sign_in("unlucky", "password")

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
    def test_update(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
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

        update_response = client.patch(
            f"/libraries/{library_id}/permission/2",
            json={"can_edit": True},
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert update_response.status_code == 200
        assert update_response.json().get("can_edit") is True

        other_session = sign_in("unlucky", "password")

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {other_session.access_token}"},
        )
        assert read_response.status_code == 200

    def test_rejects_current_user(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
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
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_requires_user_to_exist",
                "home_path": None,
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
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_requires_permission",
                "home_path": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = sign_in("unlucky", "password")

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
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
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

        other_session = sign_in("unlucky", "password")

        read_response = client.get(
            f"/libraries/{library_id}",
            headers={"Authorization": f"Bearer {other_session.access_token}"},
        )
        assert read_response.status_code == 404

    def test_rejects_current_user(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_update",
                "home_path": None,
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
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestUpdateLibraryPermissions::test_requires_user_to_exist",
                "home_path": None,
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
        sign_in: SignIn,
    ):
        creator_session = sign_in("test", "password")

        create_response = client.post(
            "/libraries/create",
            json={
                "name": "TestDeleteLibraryPermissions::test_requires_permission",
                "home_path": None,
            },
            headers={"Authorization": f"Bearer {creator_session.access_token}"},
        )
        assert create_response.status_code == 200
        library_id = create_response.json().get("id")

        forbidden_session = sign_in("unlucky", "password")

        delete_response = client.delete(
            f"/libraries/{library_id}/permission/2",
            headers={"Authorization": f"Bearer {forbidden_session.access_token}"},
        )
        assert delete_response.status_code == 404
        assert delete_response.json().get("detail") == "Library not found"
