import asyncio
import logging
import multiprocessing
from contextlib import contextmanager
from multiprocessing.connection import Connection
from typing import override

from watchdog.events import (
    DirDeletedEvent,
    DirMovedEvent,
    FileDeletedEvent,
    FileModifiedEvent,
    FileMovedEvent,
    FileSystemEventHandler,
)
from watchdog.observers import Observer

from config import config
from schemas.user import UserEvent
from utilities.user_events import get_user_events
from worker.events import (
    LibraryWorkerReply,
    SynchedLibraryWorkerReply,
    SyncLibraryWorkerEvent,
)
from worker.main import worker_main


class _FileSystemEventForwarder(FileSystemEventHandler):
    def __init__(self, conn):
        self._conn = conn
        """
        connection used to forward events to the worker child process.
        """

    @override
    def on_any_event(self, event):
        self._conn.send(event)


_worker_conn: Connection | None = None


async def _process_reply(reply: LibraryWorkerReply):
    logging.debug(f"Library worker event reply: {reply}")
    match reply:
        case SynchedLibraryWorkerReply():
            user_events = await get_user_events()
            await user_events.notify(
                set(reply.affected_user_ids),
                UserEvent(event_type="libraries_changed", ids=[reply.library_id]),
            )
        case _:
            logging.error(f"*** Ignoring reply: {reply}")


async def sync_library(library_id: int):
    """
    Enqueue a request to sync a library if the worker is initialized.
    """
    if _worker_conn is not None:
        _worker_conn.send(SyncLibraryWorkerEvent(library_id))


@contextmanager
def library_worker():
    global _worker_conn
    if _worker_conn is not None:
        raise RuntimeError("Library worker already initialized")

    if (
        config.watch_library
        and config.library_home.scheme == "file"
        and config.library_home.path != "/"
    ):
        library_home_path = config.library_home_path
        if library_home_path.exists() and library_home_path.is_dir():
            parent_conn, child_conn = multiprocessing.Pipe()

            _worker_conn = parent_conn  # pyright: ignore[reportAssignmentType]
            loop = asyncio.get_event_loop()
            loop.add_reader(
                parent_conn.fileno(),
                lambda: loop.create_task(_process_reply(parent_conn.recv())),
            )

            worker_process = multiprocessing.Process(
                target=worker_main,
                args=(child_conn,),
            )
            worker_process.start()

            event_handler = _FileSystemEventForwarder(parent_conn)
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
                loop.remove_reader(parent_conn.fileno())
                parent_conn.close()
                _worker_conn = None
        else:
            logging.warning(
                f"*** library_home refers to directory that does not exist: {config.library_home}"
            )
            yield
    else:
        yield


__all__ = [
    "sync_library",
    "library_worker",
]
