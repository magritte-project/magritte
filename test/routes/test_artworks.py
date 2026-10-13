import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from conftest import AuthFixture
from magritte.model.artwork import Artwork
from magritte.schemas.artwork import ArtworkKind


@pytest_asyncio.fixture
async def throwaway_artwork(
    client: TestClient,
    admin_auth: AuthFixture,
    faker: Faker,
) -> int:
    session = admin_auth.sign_in()

    response = client.post(
        "/artworks/create",
        json={
            "kind": "front_cover",
            "image_url": faker.image_url(),
            "background_color": faker.hex_color(),
            "primary_color": faker.hex_color(),
            "secondary_color": faker.hex_color(),
            "tertiary_color": faker.hex_color(),
        },
        headers={"Authorization": f"Bearer {session.access_token}"},
    )
    return response.json().get("id")


@pytest_asyncio.fixture
async def fake_managed_artwork(
    db_session: AsyncSession,
    faker: Faker,
):
    fake_image_url = faker.url(schemes=["file"])
    fake_image_hash = Artwork.create_image_hash(fake_image_url.encode("utf-8"))
    fake_artwork = Artwork(
        kind=ArtworkKind.FRONT_COVER,
        image_hash=fake_image_hash,
        image_url=fake_image_url,
        background_color=faker.hex_color(),
        primary_color=faker.hex_color(),
        secondary_color=faker.hex_color(),
        tertiary_color=faker.hex_color(),
    )
    db_session.add(fake_artwork)
    await db_session.flush()
    fake_artwork_id = fake_artwork.id
    await db_session.commit()
    return fake_artwork_id


class TestCreateArtwork:
    def test_create(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        response = client.post(
            "/artworks/create",
            json={
                "kind": "front_cover",
                "image_url": "about:blank",
                "background_color": None,
                "primary_color": None,
                "secondary_color": None,
                "tertiary_color": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") is not None
        assert response_json.get("kind") == "front_cover"
        assert response_json.get("image_url") == "about:blank"
        assert response_json.get("background_color") is None
        assert response_json.get("primary_color") is None
        assert response_json.get("secondary_color") is None
        assert response_json.get("tertiary_color") is None

    def test_handles_duplication(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        first_response = client.post(
            "/artworks/create",
            json={
                "kind": "front_cover",
                "image_url": "about:blank",
                "background_color": None,
                "primary_color": None,
                "secondary_color": None,
                "tertiary_color": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        first_response_json = first_response.json()
        assert first_response.status_code == 200

        second_response = client.post(
            "/artworks/create",
            json={
                "kind": "front_cover",
                "image_url": "about:blank",
                "background_color": "#000000",
                "primary_color": "#ffffff",
                "secondary_color": "#eeeeee",
                "tertiary_color": "#111111",
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        second_response_json = second_response.json()
        assert second_response.status_code == 200
        assert second_response_json.get("id") == first_response_json.get("id")
        assert second_response_json.get("kind") == first_response_json.get("kind")
        assert second_response_json.get("image_url") == first_response_json.get(
            "image_url"
        )
        assert second_response_json.get("background_color") == "#000000"
        assert second_response_json.get("primary_color") == "#ffffff"
        assert second_response_json.get("secondary_color") == "#eeeeee"
        assert second_response_json.get("tertiary_color") == "#111111"

    def test_rejects_file_urls(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        response = client.post(
            "/artworks/create",
            json={
                "kind": "front_cover",
                "image_url": "file:///your/secrets",
                "background_color": None,
                "primary_color": None,
                "secondary_color": None,
                "tertiary_color": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 422

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.post(
            "/sources/create",
            json={
                "kind": "front_cover",
                "image_url": "about:blank",
                "background_color": None,
                "primary_color": None,
                "secondary_color": None,
                "tertiary_color": None,
            },
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestUpdateArtwork:
    def test_update(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        throwaway_artwork: int,
    ):
        session = admin_auth.sign_in()
        response = client.patch(
            f"/artworks/{throwaway_artwork}",
            json={
                "kind": "front_cover",
                "image_url": "about:blank",
                "background_color": None,
                "primary_color": None,
                "secondary_color": None,
                "tertiary_color": None,
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200
        assert response_json.get("id") is not None
        assert response_json.get("kind") == "front_cover"
        assert response_json.get("image_url") == "about:blank"
        assert response_json.get("background_color") is None
        assert response_json.get("primary_color") is None
        assert response_json.get("secondary_color") is None
        assert response_json.get("tertiary_color") is None

    def test_cannot_update_managed_artwork(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fake_managed_artwork: int,
    ):
        session = admin_auth.sign_in()
        response = client.patch(
            f"/artworks/{fake_managed_artwork}",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "Artwork is managed"

    def test_requires_source_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        response = client.patch(
            "/artworks/99999999",
            json={},
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Artwork not found"

    def test_rejects_file_urls(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        response = client.patch(
            "/artworks/1",
            json={
                "image_url": "file:///your/secrets",
            },
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 422

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.patch(
            "/artworks/1",
            json={},
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestDeleteSource:
    def test_delete(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        throwaway_artwork: int,
    ):
        session = admin_auth.sign_in()
        response = client.delete(
            f"/artworks/{throwaway_artwork}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    def test_cannot_update_managed_artwork(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        fake_managed_artwork: int,
    ):
        session = admin_auth.sign_in()
        response = client.delete(
            f"/artworks/{fake_managed_artwork}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 400
        assert response.json().get("detail") == "Artwork is managed"

    def test_requires_source_to_exist(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()
        response = client.delete(
            "/artworks/99999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Artwork not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.delete(
            "/artworks/1",
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadArtworkImage:
    def test_requires_valid_token(
        self,
        client: TestClient,
    ):
        response = client.get("/artworks/1/image?token=123")
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
            f"/artworks/99999999/image?token={token}",
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Artwork not found"
