import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from conftest import SignIn
from magritte.model.extension import Extension
from magritte.schemas.extension import ExtensionManifest


@pytest_asyncio.fixture
async def throwaway_extension(
    faker: Faker,
    db_session: AsyncSession,
) -> int:
    manifest_id = faker.uuid4()
    manifest_url = faker.url()
    manifest_name = faker.name()
    throwaway_extension = Extension(
        manifest_id=manifest_id,
        manifest_url=manifest_url,
        manifest_name=manifest_name,
        manifest=ExtensionManifest(
            name=manifest_name,
            id=manifest_id,
            version="0",
            description=None,
            url=manifest_url,
            preferredWidth=None,
            preferredHeight=None,
            permissions=None,
            sourceSchemes=None,
        ).model_dump(),
    )
    db_session.add(throwaway_extension)
    await db_session.flush()
    throwaway_extension_id = throwaway_extension.id

    await db_session.commit()

    return throwaway_extension_id


class TestDeleteExtension:
    def test_delete(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_extension: int,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            f"/extensions/available/{throwaway_extension}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert response.json().get("message") == "Extension deleted successfully"

    def test_requires_extension_to_be_available(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("test", "password")

        response = client.delete(
            "/extensions/available/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Extension not found"

    def test_requires_admin(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("restricted", "password")

        response = client.delete(
            "/extensions/available/1",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 401
        assert response.json().get("detail") == "Not enough permissions"


class TestReadAvailableExtensions:
    def test_read(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_extension: int,
    ):
        session = sign_in("test", "password")

        response = client.get(
            "/extensions/available",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = response.json()
        assert response.status_code == 200

        assert response_json.get("offset") == 0
        assert response_json.get("limit") == 100
        assert response_json.get("total") == 1
        assert any(
            extension.get("id") == throwaway_extension
            for extension in response_json.get("items")
        )

    def test_does_not_require_admin(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("restricted", "password")

        response = client.get(
            "/extensions/available",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get("/extensions/available")
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestInstallExtension:
    def test_install(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_extension: int,
    ):
        session = sign_in("restricted", "password")

        response = client.post(
            f"/extensions/available/{throwaway_extension}/install",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert response.json().get("message") == "Extension installed successfully"

    def test_rejects_already_installed_extension(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_extension: int,
    ):
        session = sign_in("restricted", "password")

        response_1 = client.post(
            f"/extensions/available/{throwaway_extension}/install",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response_1.status_code == 200

        response_2 = client.post(
            f"/extensions/available/{throwaway_extension}/install",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response_2.status_code == 409
        assert (
            response_2.json().get("detail") == "User already installed this extension"
        )

    def test_requires_extension_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("restricted", "password")

        response = client.post(
            "/extensions/available/9999999/install",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Extension not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.post("/extensions/available/1/install")
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestUninstallExtension:
    def test_uninstall(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_extension: int,
    ):
        session = sign_in("restricted", "password")

        install_response = client.post(
            f"/extensions/available/{throwaway_extension}/install",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert install_response.status_code == 200

        uninstall_response = client.delete(
            f"/extensions/installed/{throwaway_extension}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert uninstall_response.status_code == 200
        assert (
            uninstall_response.json().get("message")
            == "Extension uninstalled successfully"
        )

    def test_requires_extension_to_be_installed(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_extension: int,
    ):
        session = sign_in("restricted", "password")

        uninstall_response = client.delete(
            f"/extensions/installed/{throwaway_extension}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert uninstall_response.status_code == 409
        assert (
            uninstall_response.json().get("detail")
            == "User has not installed this extension"
        )

    def test_requires_extension_to_exist(
        self,
        client: TestClient,
        sign_in: SignIn,
    ):
        session = sign_in("restricted", "password")

        response = client.delete(
            "/extensions/installed/99999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Extension not found"

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.delete("/extensions/installed/1")
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"


class TestReadInstalledExtensions:
    def test_read(
        self,
        client: TestClient,
        sign_in: SignIn,
        throwaway_extension: int,
    ):
        session = sign_in("test", "password")

        install_response = client.post(
            f"/extensions/available/{throwaway_extension}/install",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert install_response.status_code == 200

        read_response = client.get(
            "/extensions/installed",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        response_json = read_response.json()
        assert read_response.status_code == 200

        assert response_json.get("offset") == 0
        assert response_json.get("limit") == 100
        assert response_json.get("total") == 1
        assert any(
            extension.get("id") == throwaway_extension
            for extension in response_json.get("items")
        )

    def test_requires_user(
        self,
        client: TestClient,
    ):
        response = client.get("/extensions/installed")
        assert response.status_code == 401
        assert response.json().get("detail") == "Not authenticated"
