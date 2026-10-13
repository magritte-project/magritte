from unittest.mock import AsyncMock, Mock

import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient
from httpx2 import AsyncClient, Response
from pydantic import HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession

from conftest import AuthFixture
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
            url=manifest_url,
        ).model_dump(),
    )
    db_session.add(throwaway_extension)
    await db_session.flush()
    throwaway_extension_id = throwaway_extension.id

    await db_session.commit()

    return throwaway_extension_id


class TestExtensionManifest:
    @pytest.mark.asyncio
    async def test_resolves_relative_urls(
        self,
        faker: Faker,
    ):
        mock_manifest = ExtensionManifest(
            name=faker.name(),
            id=faker.uuid4(),
            version="0.0.0",
            description=faker.sentence(),
            url="/",
            icon_url="/icon.svg",
        )
        mock_client = Mock(spec=AsyncClient)
        mock_client.get = AsyncMock(
            return_value=Response(
                status_code=200,
                text=mock_manifest.model_dump_json(),
            )
        )

        fetched_manifest = await ExtensionManifest.fetch_from(
            client=mock_client,
            manifest_url=HttpUrl("http://localhost:1234/extension.magritte.json"),
        )
        assert fetched_manifest.url == "http://localhost:1234/"
        assert fetched_manifest.icon_url == "http://localhost:1234/icon.svg"

    @pytest.mark.asyncio
    async def test_leaves_absolute_urls_unmodified(
        self,
        faker: Faker,
    ):
        mock_manifest = ExtensionManifest(
            name=faker.name(),
            id=faker.uuid4(),
            version="0.0.0",
            description=faker.sentence(),
            url="http://localhost:4321/",
            icon_url="http://localhost:4321/icon.svg",
        )
        mock_client = Mock(spec=AsyncClient)
        mock_client.get = AsyncMock(
            return_value=Response(
                status_code=200,
                text=mock_manifest.model_dump_json(),
            )
        )

        fetched_manifest = await ExtensionManifest.fetch_from(
            client=mock_client,
            manifest_url=HttpUrl("http://localhost:1234/extension.magritte.json"),
        )
        assert fetched_manifest.url == "http://localhost:4321/"
        assert fetched_manifest.icon_url == "http://localhost:4321/icon.svg"


class TestDeleteExtension:
    def test_delete(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        throwaway_extension: int,
    ):
        session = admin_auth.sign_in()

        response = client.delete(
            f"/extensions/available/{throwaway_extension}",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert response.json().get("message") == "Extension deleted successfully"

    def test_requires_extension_to_be_available(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
    ):
        session = admin_auth.sign_in()

        response = client.delete(
            "/extensions/available/9999999",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 404
        assert response.json().get("detail") == "Extension not found"

    def test_requires_admin(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

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
        admin_auth: AuthFixture,
        throwaway_extension: int,
    ):
        session = admin_auth.sign_in()

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
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

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
        standard_auth: AuthFixture,
        throwaway_extension: int,
    ):
        session = standard_auth.sign_in()

        response = client.post(
            f"/extensions/available/{throwaway_extension}/install",
            headers={"Authorization": f"Bearer {session.access_token}"},
        )
        assert response.status_code == 200
        assert response.json().get("message") == "Extension installed successfully"

    def test_rejects_already_installed_extension(
        self,
        client: TestClient,
        standard_auth: AuthFixture,
        throwaway_extension: int,
    ):
        session = standard_auth.sign_in()

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
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

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
        standard_auth: AuthFixture,
        throwaway_extension: int,
    ):
        session = standard_auth.sign_in()

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
        standard_auth: AuthFixture,
        throwaway_extension: int,
    ):
        session = standard_auth.sign_in()

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
        standard_auth: AuthFixture,
    ):
        session = standard_auth.sign_in()

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
        admin_auth: AuthFixture,
        throwaway_extension: int,
    ):
        session = admin_auth.sign_in()

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
