from fastapi.testclient import TestClient

from conftest import SignIn


def test_read_source_requires_user(client: TestClient):
    response = client.get("/sources/1")
    assert response.status_code == 401
    assert response.json().get("detail") == "Not authenticated"


def test_read_source_requires_source_to_exist(client: TestClient, sign_in: SignIn):
    session = sign_in("test", "password")

    response = client.get(
        "/sources/99999999",
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    assert response.status_code == 404
    assert response.json().get("detail") == "Source not found"


def test_stream_source_file_requires_valid_token(client: TestClient):
    response = client.get("/sources/1/file?token=123")
    assert response.status_code == 401
    assert response.json().get("detail") == "Could not validate credentials"


def test_stream_source_file_requires_source_to_exist(
    client: TestClient, sign_in: SignIn
):
    session = sign_in("test", "password")

    response = client.get(
        f"/sources/99999999/file?token={session.access_token}",
    )
    assert response.status_code == 404
    assert response.json().get("detail") == "Source not found"
