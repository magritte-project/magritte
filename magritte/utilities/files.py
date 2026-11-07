from collections.abc import Iterable
from os import PathLike
from pathlib import Path
from urllib.parse import unquote, urlparse
from urllib.request import pathname2url


def path_as_file_uri(path: PathLike):
    """
    Converts a path to a file URI.

    :param path: The path to convert. Relative paths and
    symlinks are resolved before constructing the URI.
    :return: An absolute `file:` URI.
    """
    resolved_path = Path(path).resolve()
    file_uri_path = pathname2url(str(resolved_path))
    return f"file://{file_uri_path}"


def is_file_uri(uri: str) -> bool:
    """
    Check whether a URI refers to a local file.

    Uses the same parsing as `file_uri_as_contained_path`, so variations
    such as `FILE:` or leading whitespace are recognized as file URIs.

    :param uri: The URI to check.
    :return: `True` if the URI uses the `file` scheme; `False` otherwise.
    """
    return urlparse(uri).scheme == "file"


def is_safe_relative_path(path: str) -> bool:
    """
    Check whether a path is relative and cannot escape the directory it is joined to.

    :param path: The path to check.
    :return: `True` if the path is relative, has no drive or root,
    and contains no `..` components; `False` otherwise.
    """
    candidate = Path(path)
    return not (
        candidate.is_absolute()
        or candidate.drive
        or candidate.root
        or ".." in candidate.parts
    )


def is_contained_path(path: Path, base: Path) -> bool:
    """
    Check whether a path resolves to a location inside a base directory.

    :param path: The path to check. Symlinks and `..` components are resolved.
    :param base: The directory the path must be inside of.
    :return: `True` if the resolved path is the base or is inside it.
    """
    return path.resolve().is_relative_to(base.resolve())


def file_uri_as_contained_path(uri: str, roots: Iterable[Path]) -> Path | None:
    """
    Convert a `file:` URI into a path, provided it is inside one of the given roots.

    :param uri: The URI to convert.
    :param roots: The directories the path is allowed to be inside of.
    :return: The resolved path, or `None` if the URI is not a file URI
    or the path is outside of every root.
    """
    parsed_uri = urlparse(uri)
    if parsed_uri.scheme != "file":
        return None

    resolved_path = Path(unquote(parsed_uri.path)).resolve()
    for root in roots:
        if resolved_path.is_relative_to(root.resolve()):
            return resolved_path
    return None
