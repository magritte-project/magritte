from fastapi.testclient import TestClient


def test_create_and_read_library(client: TestClient):
    token_response = client.post(
        "/sign-in",
        data={
            "username": "test",
            "password": "password",
        },
    )
    assert token_response.status_code == 200
    access_token = token_response.json().get("access_token")

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_create_library",
        },
        headers={"Authorization": f"Bearer {access_token}"},
    )
    create_json = create_response.json()
    assert create_response.status_code == 200
    assert create_json.get("id") is not None
    assert create_json.get("name") == "test_create_library"
    library_id = create_json.get("id")

    read_response = client.get(
        f"/libraries/{library_id}",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    read_json = read_response.json()
    assert read_response.status_code == 200
    assert read_json.get("id") == library_id
    assert read_json.get("name") == "test_create_library"


def test_read_library_requires_library_to_exist(client: TestClient):
    token_response = client.post(
        "/sign-in",
        data={
            "username": "test",
            "password": "password",
        },
    )
    assert token_response.status_code == 200
    access_token = token_response.json().get("access_token")

    read_response = client.get(
        "/libraries/999999",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    assert read_response.status_code == 404
    assert read_response.json().get("detail") == "Library not found"


def test_read_library_requires_view_permission(client: TestClient):
    creator_token_response = client.post(
        "/sign-in",
        data={
            "username": "test",
            "password": "password",
        },
    )
    assert creator_token_response.status_code == 200
    creator_access_token = creator_token_response.json().get("access_token")

    create_response = client.post(
        "/libraries/create",
        json={
            "name": "test_read_library_requires_view_permission",
        },
        headers={"Authorization": f"Bearer {creator_access_token}"},
    )
    assert create_response.status_code == 200
    library_id = create_response.json().get("id")

    forbidden_token_response = client.post(
        "/sign-in",
        data={
            "username": "unlucky",
            "password": "password",
        },
    )
    assert forbidden_token_response.status_code == 200
    forbidden_access_token = forbidden_token_response.json().get("access_token")

    read_response = client.get(
        f"/libraries/{library_id}",
        headers={"Authorization": f"Bearer {forbidden_access_token}"},
    )
    assert read_response.status_code == 404
    assert read_response.json().get("detail") == "Library not found"
