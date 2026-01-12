import logging
import multiprocessing
from contextlib import contextmanager
from pathlib import Path
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
from worker.events import SyncLibraryEvent
from worker.main import worker_main


class _FileSystemEventForwarder(FileSystemEventHandler):
    def __init__(
        self,
        event_queue: multiprocessing.Queue,
    ):
        self._event_queue: multiprocessing.Queue = event_queue
        """
        Queue used to forward events to the worker child process.
        """

    @override
    def on_any_event(self, event):
        self._event_queue.put(event)


_event_queue: "multiprocessing.Queue | None" = None


def sync_library(library_id: int):
    """
    Enqueue a request to sync a library if the worker is initialized.
    """
    if _event_queue is not None:
        _event_queue.put(SyncLibraryEvent(library_id))


@contextmanager
def library_worker():
    global _event_queue
    if _event_queue is not None:
        raise RuntimeError("Library worker already initialized")

    if (
        config.watch_library
        and config.library_home.scheme == "file"
        and config.library_home.path != "/"
    ):
        library_home_path = Path.from_uri(str(config.library_home))
        if library_home_path.exists() and library_home_path.is_dir():
            _event_queue = multiprocessing.Queue()
            worker_process = multiprocessing.Process(
                target=worker_main,
                args=(_event_queue,),
            )
            worker_process.start()

            event_handler = _FileSystemEventForwarder(_event_queue)
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
                _event_queue = None
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
