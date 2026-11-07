from pathlib import Path

import pytest

from magritte.ingestion.files import _safe_path_component
from magritte.utilities.files import (
    file_uri_as_contained_path,
    is_contained_path,
    is_file_uri,
    is_safe_relative_path,
    path_as_file_uri,
)


@pytest.mark.parametrize("name", ["", ".", "..", " .. ", "...", "/", "../"])
def test_safe_path_component_rejects_traversal(name: str):
    assert _safe_path_component(name, "Fallback") == "Fallback"


@pytest.mark.parametrize(
    "name,expected",
    [("Artist", "Artist"), ("AC/DC", "ACDC"), ("a/../b", "a..b")],
)
def test_safe_path_component_keeps_names(name: str, expected: str):
    assert _safe_path_component(name, "Fallback") == expected


@pytest.mark.parametrize(
    "uri",
    ["file:///a", "FILE:///a", "File:///a", " file:///a", "\tfile:///a"],
)
def test_is_file_uri(uri: str):
    assert is_file_uri(uri)


@pytest.mark.parametrize("uri", ["https://example.com/a.mp3", "a/file:b", ""])
def test_is_not_file_uri(uri: str):
    assert not is_file_uri(uri)


@pytest.mark.parametrize("path", ["music", "a/b", "a/./b", ""])
def test_is_safe_relative_path(path: str):
    assert is_safe_relative_path(path)


@pytest.mark.parametrize("path", ["..", "../a", "a/../..", "a/..", "/etc"])
def test_is_not_safe_relative_path(path: str):
    assert not is_safe_relative_path(path)


def test_is_contained_path(tmp_path: Path):
    assert is_contained_path(tmp_path / "a" / "b", tmp_path)
    assert is_contained_path(tmp_path, tmp_path)
    assert not is_contained_path(tmp_path / ".." / "a", tmp_path)


def test_is_contained_path_follows_symlinks(tmp_path: Path):
    base = tmp_path / "base"
    base.mkdir()
    (base / "link").symlink_to(tmp_path)
    assert not is_contained_path(base / "link" / "secret", base)


def test_file_uri_as_contained_path(tmp_path: Path):
    root = tmp_path / "root"
    root.mkdir()
    inside = root / "song.mp3"
    outside = tmp_path / "secret.txt"

    assert file_uri_as_contained_path(path_as_file_uri(inside), [root]) == (
        inside.resolve()
    )
    assert file_uri_as_contained_path(path_as_file_uri(outside), [root]) is None
    assert file_uri_as_contained_path("https://example.com/a", [root]) is None
