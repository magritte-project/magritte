from fastapi.testclient import TestClient

from conftest import SignIn


def test_create_and_read_library(client: TestClient, sign_in: SignIn):
    session = sign_in("test", "password")

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_create_library",
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    create_json = create_response.json()
    assert create_response.status_code == 200
    assert create_json.get("id") is not None
    assert create_json.get("name") == "test_create_library"
    library_id = create_json.get("id")

    read_response = client.get(
        f"/libraries/{library_id}",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    read_json = read_response.json()
    assert read_response.status_code == 200
    assert read_json.get("id") == library_id
    assert read_json.get("name") == "test_create_library"


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
