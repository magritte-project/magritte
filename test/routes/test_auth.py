from unittest.mock import AsyncMock

from fastapi.testclient import TestClient


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
    assert response_json.get("email") is None
    assert response_json.get("username") == "rene"
    assert response_json.get("preferred_name") is None


def test_sign_up_rejects_already_in_use_usernames(client: TestClient):
    response = client.post(
        "/sign-up",
        json={
            "username": "admin",
            "password": "passpass",
        },
    )
    assert response.status_code == 409
    assert response.json().get("detail") == "Username already taken"


def test_sign_up_with_email_sends_verification(
    client: TestClient,
    installed_mock_email_client: AsyncMock,
):
    response = client.post(
        "/sign-up",
        json={
            "email": "anybody@nowhere.com",
            "username": "anybody",
            "password": "passpass",
        },
    )
    response_json = response.json()
    assert response.status_code == 200
    assert response_json.get("email") == "anybody@nowhere.com"

    installed_mock_email_client.send.assert_called_once()


def test_sign_up_with_email_rejects_already_in_use_email(
    client: TestClient,
    installed_mock_email_client: AsyncMock,
):
    response_1 = client.post(
        "/sign-up",
        json={
            "email": "anybody@nowhere.com",
            "username": "anybody",
            "password": "passpass",
        },
    )
    assert response_1.status_code == 200

    response_2 = client.post(
        "/sign-up",
        json={
            "email": "anybody@nowhere.com",
            "username": "anybody2",
            "password": "passpass",
        },
    )
    assert response_2.status_code == 409
    assert response_2.json().get("detail") == "Email already in use"

    # It should only send the email for the successful request
    installed_mock_email_client.send.assert_called_once()


def test_sign_up_requires_email_when_configured(
    client: TestClient,
    installed_mock_email_client: AsyncMock,
):
    response = client.post(
        "/sign-up",
        json={
            "username": "admin",
            "password": "passpass",
        },
    )
    assert response.status_code == 422
    assert response.json().get("detail") == "Email required"

    installed_mock_email_client.send.assert_not_called()


def test_sign_in(client: TestClient):
    token_response = client.post(
        "/sign-in",
        data={
            "username": "admin",
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
            "username": "admin",
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
