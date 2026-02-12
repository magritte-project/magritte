from mimetypes import MimeTypes
from pathlib import Path

_mime_types: MimeTypes | None = None


def get_mime_types() -> MimeTypes:
    """
    Returns the MimeTypes instance used for determining MIME types.
    """
    global _mime_types
    if _mime_types is None:
        mime_types_path = Path(__file__).absolute().parent.joinpath("mime.types")
        _mime_types = MimeTypes(filenames=[mime_types_path])
    return _mime_types
