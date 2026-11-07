"""
Regression tests for access control around libraries, sources, artworks, and files.
"""

from pathlib import Path
from typing import Any

import pytest
import pytest_asyncio
from fastapi.testclient import TestClient

from conftest import AuthFixture
from magritte.config import config
from magritte.model.artwork import Artwork
from magritte.model.song import SongLibraryLink
from magritte.model.source import Source
from magritte.utilities.files import path_as_file_uri

FILE_URLS = [
    "file:///etc/passwd",
    "FILE:///etc/passwd",
    "File:///etc/passwd",
    " file:///etc/passwd",
]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _files_token(client: TestClient, access_token: str) -> str:
    response = client.post("/users/files/preflight", headers=_auth(access_token))
    assert response.status_code == 200
    return response.json()["token"]


def _source(url: str) -> dict[str, Any]:
    return {
        "url": url,
        "mime_type": "audio/mpeg",
        "extension_manifest_id": None,
        "extension_tag": None,
    }


def _artwork(image_url: str) -> dict[str, Any]:
    return {
        "kind": "front_cover",
        "image_url": image_url,
        "background_color": None,
        "primary_color": None,
        "secondary_color": None,
        "tertiary_color": None,
    }


def _song(
    title: str,
    *,
    sources: list[dict[str, Any]] | None = None,
    artworks: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "artist_name": f"{title} Artist",
        "album_title": f"{title} Album",
        "artworks": artworks or [],
        "sources": sources or [_source(f"https://example.com/{title}.mp3")],
        "start_time": 0,
        "end_time": 100,
        "title": title,
        "album_artist": None,
        "composer": None,
        "genre": None,
        "release_date": None,
        "track_number": 1,
        "track_total": 1,
        "disc_number": 1,
        "disc_total": 1,
        "lyrics": None,
        "rating": None,
        "bpm": None,
        "comment": None,
        "grouping": None,
        "mcn": None,
        "isrc": None,
        "music_brainz_release_id": None,
        "music_brainz_recording_id": None,
    }


def _ingest(
    client: TestClient, token: str, library_id: int, song: dict[str, Any]
) -> dict[str, Any]:
    response = client.post(
        f"/libraries/{library_id}/ingest/songs",
        json={"songs": [song]},
        headers=_auth(token),
    )
    assert response.status_code == 200, response.text
    return response.json()[0]


@pytest.fixture
def victim_song(client: TestClient, admin_auth: AuthFixture) -> dict[str, Any]:
    """A song in the admin's Scratch library."""
    return _ingest(
        client,
        admin_auth.sign_in().access_token,
        2,
        _song(
            "Victim",
            artworks=[_artwork("https://example.com/victim.png")],
        ),
    )


@pytest.fixture
def attacker(client: TestClient, fresh_admin_auth: AuthFixture) -> tuple[str, int]:
    """A user with every scope and full permissions on a library of their own."""
    token = fresh_admin_auth.sign_in().access_token
    response = client.post(
        "/libraries/create",
        json={
            "name": "Attacker Library",
            "home_path": None,
            "uploads_enabled": False,
            "cover_artwork": None,
        },
        headers=_auth(token),
    )
    assert response.status_code == 200, response.text
    return token, response.json()["id"]


class TestFileUrlsRejected:
    @pytest.mark.parametrize("url", FILE_URLS)
    def test_create_source(self, client: TestClient, admin_auth: AuthFixture, url):
        response = client.post(
            "/sources/create",
            json=_source(url),
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 422

    @pytest.mark.parametrize("url", FILE_URLS)
    def test_update_source(
        self, client: TestClient, admin_auth: AuthFixture, victim_song, url
    ):
        response = client.patch(
            f"/sources/{victim_song['sources'][0]['id']}",
            json={"url": url},
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 422

    @pytest.mark.parametrize("url", FILE_URLS)
    def test_create_artwork(self, client: TestClient, admin_auth: AuthFixture, url):
        response = client.post(
            "/artworks/create",
            json=_artwork(url),
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 422

    @pytest.mark.parametrize("url", FILE_URLS)
    def test_ingest_song_source(self, client: TestClient, admin_auth: AuthFixture, url):
        response = client.post(
            "/libraries/2/ingest/songs",
            json={"songs": [_song("File Source", sources=[_source(url)])]},
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 422

    @pytest.mark.parametrize("url", FILE_URLS)
    def test_ingest_song_artwork(
        self, client: TestClient, admin_auth: AuthFixture, url
    ):
        response = client.post(
            "/libraries/2/ingest/songs",
            json={"songs": [_song("File Artwork", artworks=[_artwork(url)])]},
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 422


@pytest_asyncio.fixture
async def music_home(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """Point the music and data homes at temporary directories."""
    music_home = tmp_path / "music"
    music_home.mkdir()
    data_home = tmp_path / "data"
    (data_home / "artwork").mkdir(parents=True)
    monkeypatch.setattr(config, "music_home", str(music_home))
    monkeypatch.setattr(config, "data_home", str(data_home))
    (tmp_path / "secret.txt").write_text("secret")
    return music_home


async def _set_source_url(admin_auth: AuthFixture, source_id: int, path: Path):
    async with admin_auth.db_session() as session:
        source = await session.get(Source, source_id)
        assert source
        source.url = path_as_file_uri(path)


async def _set_artwork_url(admin_auth: AuthFixture, artwork_id: int, path: Path):
    async with admin_auth.db_session() as session:
        artwork = await session.get(Artwork, artwork_id)
        assert artwork
        artwork.image_url = path_as_file_uri(path)


class TestStreamSourceFile:
    @pytest.mark.asyncio
    async def test_member_can_stream(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        victim_song,
        music_home: Path,
    ):
        song_path = music_home / "song.mp3"
        song_path.write_bytes(b"audio")
        source_id = victim_song["sources"][0]["id"]
        await _set_source_url(admin_auth, source_id, song_path)

        token = admin_auth.sign_in().access_token
        response = client.get(
            f"/sources/{source_id}/file",
            params={"token": _files_token(client, token)},
        )
        assert response.status_code == 200
        assert response.content == b"audio"

    @pytest.mark.asyncio
    async def test_non_member_cannot_stream(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        standard_auth: AuthFixture,
        victim_song,
        music_home: Path,
    ):
        song_path = music_home / "song.mp3"
        song_path.write_bytes(b"audio")
        source_id = victim_song["sources"][0]["id"]
        await _set_source_url(admin_auth, source_id, song_path)

        token = standard_auth.sign_in().access_token
        response = client.get(
            f"/sources/{source_id}/file",
            params={"token": _files_token(client, token)},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_file_outside_music_home_not_served(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        victim_song,
        music_home: Path,
    ):
        source_id = victim_song["sources"][0]["id"]
        await _set_source_url(admin_auth, source_id, music_home.parent / "secret.txt")

        token = admin_auth.sign_in().access_token
        response = client.get(
            f"/sources/{source_id}/file",
            params={"token": _files_token(client, token)},
        )
        assert response.status_code == 404


class TestReadArtworkImage:
    @pytest.mark.asyncio
    async def test_member_can_read(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        victim_song,
        music_home: Path,
    ):
        image_path = config.artwork_home_path / "cover.png"
        image_path.write_bytes(b"image")
        artwork_id = victim_song["artworks"][0]["id"]
        await _set_artwork_url(admin_auth, artwork_id, image_path)

        token = admin_auth.sign_in().access_token
        response = client.get(
            f"/artworks/{artwork_id}/image",
            params={"token": _files_token(client, token)},
        )
        assert response.status_code == 200
        assert response.content == b"image"

    @pytest.mark.asyncio
    async def test_non_member_cannot_read(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        standard_auth: AuthFixture,
        victim_song,
        music_home: Path,
    ):
        image_path = config.artwork_home_path / "cover.png"
        image_path.write_bytes(b"image")
        artwork_id = victim_song["artworks"][0]["id"]
        await _set_artwork_url(admin_auth, artwork_id, image_path)

        token = standard_auth.sign_in().access_token
        response = client.get(
            f"/artworks/{artwork_id}/image",
            params={"token": _files_token(client, token)},
        )
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_file_outside_artwork_home_not_served(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        victim_song,
        music_home: Path,
    ):
        artwork_id = victim_song["artworks"][0]["id"]
        await _set_artwork_url(admin_auth, artwork_id, music_home.parent / "secret.txt")

        token = admin_auth.sign_in().access_token
        response = client.get(
            f"/artworks/{artwork_id}/image",
            params={"token": _files_token(client, token)},
        )
        assert response.status_code == 404


class TestSourcesScopedToLibraries:
    def test_read_all_excludes_other_libraries(
        self, client: TestClient, standard_auth: AuthFixture, victim_song
    ):
        response = client.get(
            "/sources/all", headers=_auth(standard_auth.sign_in().access_token)
        )
        assert response.status_code == 200
        ids = {item["id"] for item in response.json()["items"]}
        assert victim_song["sources"][0]["id"] not in ids

    def test_read_other_library_source(
        self, client: TestClient, standard_auth: AuthFixture, victim_song
    ):
        response = client.get(
            f"/sources/{victim_song['sources'][0]['id']}",
            headers=_auth(standard_auth.sign_in().access_token),
        )
        assert response.status_code == 404

    def test_update_other_library_source(
        self, client: TestClient, attacker, victim_song
    ):
        token, _ = attacker
        response = client.patch(
            f"/sources/{victim_song['sources'][0]['id']}",
            json={"mime_type": "text/plain"},
            headers=_auth(token),
        )
        assert response.status_code == 404

    def test_delete_other_library_source(
        self, client: TestClient, attacker, victim_song
    ):
        token, _ = attacker
        response = client.delete(
            f"/sources/{victim_song['sources'][0]['id']}", headers=_auth(token)
        )
        assert response.status_code == 404

    def test_create_existing_does_not_modify(
        self, client: TestClient, admin_auth: AuthFixture, attacker, victim_song
    ):
        token, _ = attacker
        source = victim_song["sources"][0]
        client.post(
            "/sources/create",
            json={**_source(source["url"]), "mime_type": "text/plain"},
            headers=_auth(token),
        )
        response = client.get(
            f"/sources/{source['id']}",
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.json()["mime_type"] == "audio/mpeg"


class TestArtworksScopedToLibraries:
    def test_update_other_library_artwork(
        self, client: TestClient, attacker, victim_song
    ):
        token, _ = attacker
        response = client.patch(
            f"/artworks/{victim_song['artworks'][0]['id']}",
            json={"primary_color": "#000000"},
            headers=_auth(token),
        )
        assert response.status_code == 404

    def test_delete_other_library_artwork(
        self, client: TestClient, attacker, victim_song
    ):
        token, _ = attacker
        response = client.delete(
            f"/artworks/{victim_song['artworks'][0]['id']}", headers=_auth(token)
        )
        assert response.status_code == 404

    def test_cover_from_other_library(self, client: TestClient, attacker, victim_song):
        token, library_id = attacker
        response = client.patch(
            f"/libraries/{library_id}",
            json={"cover_artwork": victim_song["artworks"][0]},
            headers=_auth(token),
        )
        assert response.status_code == 404


class TestMediaScopedToLibrary:
    @pytest.mark.parametrize(
        "path,key",
        [("songs", "id"), ("albums", "album_id"), ("artists", "artist_id")],
    )
    def test_read(self, client: TestClient, attacker, victim_song, path, key):
        token, library_id = attacker
        response = client.get(
            f"/libraries/{library_id}/{path}/{victim_song[key]}", headers=_auth(token)
        )
        assert response.status_code == 404

    @pytest.mark.parametrize(
        "path,key,body",
        [
            ("songs", "id", {"title": "changed"}),
            ("albums", "album_id", {"title": "changed"}),
            ("artists", "artist_id", {"name": "changed"}),
        ],
    )
    def test_update(self, client: TestClient, attacker, victim_song, path, key, body):
        token, library_id = attacker
        response = client.patch(
            f"/libraries/{library_id}/{path}/{victim_song[key]}",
            json=body,
            headers=_auth(token),
        )
        assert response.status_code == 404

    @pytest.mark.parametrize(
        "path,key",
        [("songs", "id"), ("albums", "album_id"), ("artists", "artist_id")],
    )
    def test_delete(
        self,
        client: TestClient,
        admin_auth: AuthFixture,
        attacker,
        victim_song,
        path,
        key,
    ):
        token, library_id = attacker
        response = client.delete(
            f"/libraries/{library_id}/{path}/{victim_song[key]}", headers=_auth(token)
        )
        assert response.status_code == 404

        response = client.get(
            f"/libraries/2/{path}/{victim_song[key]}",
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 200

    def test_link_other_library_source(self, client: TestClient, attacker, victim_song):
        token, library_id = attacker
        own_song = _ingest(client, token, library_id, _song("Own"))
        response = client.patch(
            f"/libraries/{library_id}/songs/{own_song['id']}",
            json={"source_ids": [victim_song["sources"][0]["id"]]},
            headers=_auth(token),
        )
        assert response.status_code == 404

    def test_link_other_library_artwork(
        self, client: TestClient, attacker, victim_song
    ):
        token, library_id = attacker
        own_song = _ingest(client, token, library_id, _song("Own"))
        response = client.patch(
            f"/libraries/{library_id}/songs/{own_song['id']}",
            json={"artwork_ids": [victim_song["artworks"][0]["id"]]},
            headers=_auth(token),
        )
        assert response.status_code == 404

    def test_link_other_library_album(self, client: TestClient, attacker, victim_song):
        token, library_id = attacker
        own_song = _ingest(client, token, library_id, _song("Own"))
        response = client.patch(
            f"/libraries/{library_id}/songs/{own_song['id']}",
            json={"album_id": victim_song["album_id"]},
            headers=_auth(token),
        )
        assert response.status_code == 404


class TestSharedMedia:
    @pytest_asyncio.fixture
    async def shared_song(self, admin_auth: AuthFixture, victim_song) -> dict[str, Any]:
        """The victim song, also placed in the Empty library where admin has no permissions."""
        async with admin_auth.db_session() as session:
            session.add(SongLibraryLink(song_id=victim_song["id"], library_id=1))
        return victim_song

    @pytest.mark.asyncio
    async def test_cannot_edit_song_shared_with_read_only_library(
        self, client: TestClient, admin_auth: AuthFixture, shared_song
    ):
        response = client.patch(
            f"/libraries/2/songs/{shared_song['id']}",
            json={"title": "changed"},
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_cannot_delete_song_shared_with_read_only_library(
        self, client: TestClient, admin_auth: AuthFixture, shared_song
    ):
        response = client.delete(
            f"/libraries/2/songs/{shared_song['id']}",
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 403


class TestLibraryPaths:
    @pytest.mark.parametrize("relative_to", ["..", "../..", "a/../..", "/etc"])
    def test_home_subpaths_rejects_traversal(
        self, client: TestClient, admin_auth: AuthFixture, relative_to
    ):
        response = client.get(
            "/libraries/home-subpaths",
            params={"relative_to": relative_to},
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 400

    @pytest.mark.parametrize("home_path", ["..", "../other", "a/../../b", "/etc"])
    def test_create_rejects_traversal(
        self, client: TestClient, admin_auth: AuthFixture, home_path
    ):
        response = client.post(
            "/libraries/create",
            json={
                "name": "Traversal",
                "home_path": home_path,
                "uploads_enabled": False,
                "cover_artwork": None,
            },
            headers=_auth(admin_auth.sign_in().access_token),
        )
        assert response.status_code == 422
