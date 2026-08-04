import asyncio
import logging
import multiprocessing
from contextlib import contextmanager
from tempfile import NamedTemporaryFile
from typing import TYPE_CHECKING, override

from fastapi import UploadFile
from watchdog.events import (
    DirDeletedEvent,
    DirMovedEvent,
    FileDeletedEvent,
    FileModifiedEvent,
    FileMovedEvent,
    FileSystemEventHandler,
)
from watchdog.observers import Observer

from magritte.config import config
from magritte.utilities.user_events import get_user_events
from magritte.worker.events import (
    IngestFile,
    IngestFilesLibraryWorkerEvent,
    NotifyUsersParentRequest,
    ParentRequest,
    SyncLibraryWorkerEvent,
)
from magritte.worker.main import worker_main

if TYPE_CHECKING:
    from multiprocessing.connection import Connection

_UPLOAD_CHUNK_SIZE = 1024 * 1024  # 1 MiB


class _FileSystemEventForwarder(FileSystemEventHandler):
    def __init__(self, worker_connection: "Connection"):
        self._conn: "Connection" = worker_connection
        """
        connection used to forward events to the worker child process.
        """

    @override
    def on_any_event(self, event):
        self._conn.send(event)


_worker_connection: "Connection | None" = None


async def _process_parent_request(request: ParentRequest):
    logging.debug(f"Library parent request: {request}")
    match request:
        case NotifyUsersParentRequest():
            user_events = await get_user_events()
            await user_events.notify(request.user_ids, request.event)
        case _:
            logging.error(f"*** Ignoring parent request: {request}")


async def sync_library(library_id: int):
    """
    Enqueue a request to sync a library if the worker is initialized.
    """
    if _worker_connection is not None:
        _worker_connection.send(SyncLibraryWorkerEvent(library_id))


async def ingest_uploaded_files(library_id: int, uploaded_files: list[UploadFile]):
    if _worker_connection is None:
        return

    files = list[IngestFile]()
    for uploaded_file in uploaded_files:
        with NamedTemporaryFile(delete=False) as file:
            while chunk := await uploaded_file.read(_UPLOAD_CHUNK_SIZE):
                file.write(chunk)

            files.append(
                IngestFile(
                    temp_path=file.name,
                    reported_filename=uploaded_file.filename,
                    reported_mime_type=uploaded_file.content_type,
                )
            )

    _worker_connection.send(IngestFilesLibraryWorkerEvent(library_id, files))


@contextmanager
def library_worker():
    global _worker_connection
    if _worker_connection is not None:
        raise RuntimeError("Library worker already initialized")

    library_home_path = config.music_home_path
    if library_home_path.exists() and library_home_path.is_dir():
        parent_connection, child_connection = multiprocessing.Pipe()

        _worker_connection = parent_connection
        loop = asyncio.get_event_loop()
        loop.add_reader(
            parent_connection.fileno(),
            lambda: loop.create_task(_process_parent_request(parent_connection.recv())),
        )

        worker_process = multiprocessing.Process(
            target=worker_main,
            args=(child_connection,),
        )
        worker_process.start()

        event_handler = _FileSystemEventForwarder(parent_connection)
        library_home_observer = Observer()
        library_home_observer.schedule(
            event_handler,
            str(library_home_path),
            recursive=True,
            event_filter=[
                DirDeletedEvent,
                DirMovedEvent,
                FileDeletedEvent,
                FileModifiedEvent,
                FileMovedEvent,
            ],
        )
        library_home_observer.start()
        try:
            yield
        finally:
            library_home_observer.stop()
            library_home_observer.join()
            worker_process.terminate()
            loop.remove_reader(parent_connection.fileno())
            parent_connection.close()
            _worker_connection = None
    else:
        logging.warning(
            f"*** music_home refers to directory that does not exist: {config.music_home}"
        )
        yield


__all__ = [
    "sync_library",
    "library_worker",
]
