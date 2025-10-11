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
    first_response = client.post(
        "/sign-up",
        json={
            "username": "jon",
            "password": "pass",
        },
    )
    assert first_response.status_code == 200

    second_response = client.post(
        "/sign-up",
        json={
            "username": "jon",
            "password": "pass",
        },
    )
    assert second_response.status_code == 409
    assert second_response.json().get("detail") == "Username already taken"


def test_sign_in(client: TestClient):
    sign_up_response = client.post(
        "/sign-up",
        json={
            "username": "pkc",
            "password": "pass",
        },
    )
    assert sign_up_response.status_code == 200

    token_response = client.post(
        "/sign-in",
        data={
            "username": "pkc",
            "password": "pass",
        },
    )
    token_json = token_response.json()
    assert token_response.status_code == 200
    assert "access_token" in token_json
    assert token_json.get("token_type") == "bearer"


def test_sign_in_requires_right_password(client: TestClient):
    sign_up_response = client.post(
        "/sign-up",
        json={
            "username": "suspicious",
            "password": "pass",
        },
    )
    assert sign_up_response.status_code == 200

    token_response = client.post(
        "/sign-in",
        data={
            "username": "suspicious",
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
