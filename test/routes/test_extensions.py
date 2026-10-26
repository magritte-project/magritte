import asyncio
from collections.abc import AsyncIterable, Callable
from contextlib import contextmanager

import pytest
import pytest_asyncio
from faker import Faker
from fastapi.testclient import TestClient
from httpx2 import AsyncClient, MockTransport, Request, Response
from pydantic import HttpUrl
from sqlalchemy.ext.asyncio import AsyncSession

from conftest import AuthFixture, override_dependency
from magritte.model.extension import Extension
from magritte.schemas.extension import ExtensionManifest
from magritte.utilities.http import get_http_client

MANIFEST_URL = "http://localhost:1234/extension.magritte.json"


@contextmanager
def serve_manifest(handler: Callable[[Request], Response]):
    """Route outbound requests made by the API to a mock handler"""

    async def override_get_http_client():
        async with AsyncClient(transport=MockTransport(handler)) as client:
            yield client

    with override_dependency(get_http_client, override_get_http_client):
        yield


def mock_manifest_json(faker: Faker) -> str:
    return ExtensionManifest(
        name=faker.name(),
        id=faker.uuid4(),
        version="0.0.0",
        url="/",
    ).model_dump_json()


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
        mock_transport = MockTransport(
            lambda request: Response(200, text=mock_manifest.model_dump_json())
        )

        async with AsyncClient(transport=mock_transport) as mock_client:
            fetched_manifest = await ExtensionManifest.fetch_from(
                client=mock_client,
                manifest_url=HttpUrl(MANIFEST_URL),
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
        mock_transport = MockTransport(
            lambda request: Response(200, text=mock_manifest.model_dump_json())
        )

        async with AsyncClient(transport=mock_transport) as mock_client:
            fetched_manifest = await ExtensionManifest.fetch_from(
                client=mock_client,
                manifest_url=HttpUrl(MANIFEST_URL),
            )
        assert fetched_manifest.url == "http://localhost:4321/"
        assert fetched_manifest.icon_url == "http://localhost:4321/icon.svg"


async def streamed_oversized_body():
    for _ in range(4):
        yield b"x" * 8


async def slow_body():
    yield b"{"
    await asyncio.sleep(60)
    yield b"}"


class TestImportExtension:
    def test_import(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
    ):
        session = admin_auth.sign_in()
        manifest_json = mock_manifest_json(faker)

        with serve_manifest(lambda request: Response(200, text=manifest_json)):
            response = client.post(
                "/extensions/available/import",
                json={"manifest_url": MANIFEST_URL},
                headers={"Authorization": f"Bearer {session.access_token}"},
            )
        assert response.status_code == 200
        assert response.json().get("message") == "Extension imported successfully"

    @pytest.mark.parametrize(
        "manifest_url",
        [
            "http://localhost:1234/manifest.json",
            "http://localhost:1234/extension.magritte.json/other",
        ],
    )
    def test_rejects_invalid_manifest_urls(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
        manifest_url: str,
    ):
        session = admin_auth.sign_in()
        manifest_json = mock_manifest_json(faker)

        with serve_manifest(lambda request: Response(200, text=manifest_json)):
            response = client.post(
                "/extensions/available/import",
                json={"manifest_url": manifest_url},
                headers={"Authorization": f"Bearer {session.access_token}"},
            )
        assert response.status_code == 400
        assert response.json().get("detail") == "Invalid manifest URL"

    def test_rejects_already_imported_extensions(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        faker: Faker,
    ):
        session = admin_auth.sign_in()
        manifest_json = mock_manifest_json(faker)

        with serve_manifest(lambda request: Response(200, text=manifest_json)):
            response_1 = client.post(
                "/extensions/available/import",
                json={"manifest_url": MANIFEST_URL},
                headers={"Authorization": f"Bearer {session.access_token}"},
            )
            assert response_1.status_code == 200

            response_2 = client.post(
                "/extensions/available/import",
                json={"manifest_url": MANIFEST_URL},
                headers={"Authorization": f"Bearer {session.access_token}"},
            )
        assert response_2.status_code == 409
        assert response_2.json().get("detail") == "Extension already imported"

    @pytest.mark.parametrize(
        "make_body",
        [
            pytest.param(lambda: b"x" * 32, id="content-length"),
            pytest.param(streamed_oversized_body, id="streamed"),
        ],
    )
    def test_rejects_too_large_manifests(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        monkeypatch: pytest.MonkeyPatch,
        make_body: Callable[[], bytes | AsyncIterable[bytes]],
    ):
        monkeypatch.setattr("magritte.schemas.extension._MANIFEST_MAX_BYTES", 16)
        session = admin_auth.sign_in()

        with serve_manifest(lambda request: Response(200, content=make_body())):
            response = client.post(
                "/extensions/available/import",
                json={"manifest_url": MANIFEST_URL},
                headers={"Authorization": f"Bearer {session.access_token}"},
            )
        assert response.status_code == 413
        assert response.json().get("detail") == "Manifest exceeds size limit"

    def test_applies_timeout_to_manifest_fetch(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        monkeypatch: pytest.MonkeyPatch,
    ):
        # asyncio's event loop clock can't be usefully frozen, so shrink the
        # timeout instead of fast-forwarding time
        monkeypatch.setattr(
            "magritte.schemas.extension._MANIFEST_FETCH_TIMEOUT_SECONDS", 0.1
        )
        session = admin_auth.sign_in()

        with serve_manifest(lambda request: Response(200, content=slow_body())):
            response = client.post(
                "/extensions/available/import",
                json={"manifest_url": MANIFEST_URL},
                headers={"Authorization": f"Bearer {session.access_token}"},
            )
        assert response.status_code == 504
        assert response.json().get("detail") == "Manifest fetch timed out"


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
