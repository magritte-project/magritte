from pathlib import Path
from urllib.request import pathname2url


def path_as_file_uri(path: str):
    """
    Converts a path to a file URI.

    :param path: The path to convert. Relative paths and
    symlinks are resolved before constructing the URI.
    :return: An absolute `file:` URI.
    """
    resolved_path = Path(path).resolve()
    file_uri_path = pathname2url(str(resolved_path))
    return f"file://{file_uri_path}"
