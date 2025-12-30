from fastapi.testclient import TestClient


def test_read_root(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200


def test_sign_up(client: TestClient):
    response = client.post(
        "/sign-up",
        json={
            "username": "rene",
            "password": "Th3L1$t3n1ngR00m",
        },
    )
    response_json = response.json()
    assert response.status_code == 200
    assert response_json.get("username") == "rene"
    assert response_json.get("preferred_name") is None


def test_sign_up_rejects_already_in_use_usernames(client: TestClient):
    response = client.post(
        "/sign-up",
        json={
            "username": "test",
            "password": "pass",
        },
    )
    assert response.status_code == 409
    assert response.json().get("detail") == "Username already taken"


def test_sign_in(client: TestClient):
    token_response = client.post(
        "/sign-in",
        data={
            "username": "test",
            "password": "password",
        },
    )
    token_json = token_response.json()
    assert token_response.status_code == 200
    assert "scopes" in token_json
    assert "access_token" in token_json
    assert token_json.get("token_type") == "bearer"


def test_sign_in_requires_right_password(client: TestClient):
    token_response = client.post(
        "/sign-in",
        data={
            "username": "test",
            "password": "nope",
        },
    )
    assert token_response.status_code == 400
    assert token_response.json().get("detail") == "Incorrect username or password"


def test_sign_in_requires_user_to_exist(client: TestClient):
    token_response = client.post(
        "/sign-in",
        data={
            "username": "noone",
            "password": "pass",
        },
    )
    assert token_response.status_code == 400
    assert token_response.json().get("detail") == "Incorrect username or password"
