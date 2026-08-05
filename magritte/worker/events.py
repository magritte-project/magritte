from dataclasses import dataclass
from pathlib import Path

from magritte.utilities.user_events import UserEvent


@dataclass(frozen=True)
class SyncLibraryWorkerEvent:
    library_id: int
    only_paths: list[Path] | None = None


@dataclass(frozen=True)
class IngestUploadedFile:
    temp_path: str
    """
    Where the file has been temporarily stashed for ingestion.
    """

    reported_filename: str | None
    """
    The reported name of the file, if any.
    """

    reported_mime_type: str | None
    """
    The reported content type of the file, if any.
    """


@dataclass(frozen=True)
class IngestUploadedFilesLibraryWorkerEvent:
    library_id: int
    uploaded_files: list[IngestUploadedFile]


LibraryWorkerEvent = SyncLibraryWorkerEvent | IngestUploadedFilesLibraryWorkerEvent
"""An event passed from the server to the worker"""


@dataclass(frozen=True)
class NotifyUsersParentRequest:
    user_ids: set[int]
    event: UserEvent


ParentRequest = NotifyUsersParentRequest
"""
A request passed from the worker back to the parent server
"""
