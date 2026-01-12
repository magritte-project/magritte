import asyncio
import logging
import multiprocessing
import sys
from contextlib import asynccontextmanager, contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import override

from watchdog.events import (
    DirDeletedEvent,
    DirMovedEvent,
    FileDeletedEvent,
    FileModifiedEvent,
    FileMovedEvent,
    FileSystemEvent,
    FileSystemEventHandler,
)
from watchdog.observers import Observer

from config import config
from db import get_db_engine, get_db_session
from ingestion.files import try_ingest_path
from model import Library
from model.source import Source


class _LibraryEvent:
    pass


@dataclass(frozen=True)
class _SyncLibraryEvent(_LibraryEvent):
    library_id: int


@asynccontextmanager
async def _db_session():
    engine = await get_db_engine()
    async for session in get_db_session(engine):
        yield session


def _path_str(path: str | bytes):
    match path:
        case str():
            return path
        case bytes():
            return path.decode()


async def _process_event(event: _LibraryEvent | FileSystemEvent):
    async with _db_session() as session:
        match event:
            case _SyncLibraryEvent():
                library = await session.get_one(Library, event.library_id)
                if library.home_path is None:
                    raise ValueError(f"Library is streaming only '{event.library_id}'")

                library_home_path = Path.from_uri(str(config.library_home)).joinpath(
                    library.home_path
                )
                await try_ingest_path(
                    path=str(library_home_path),
                    follow_links=False,
                    libraries=[library],
                    session=session,
                )
            case DirDeletedEvent():
                await Source.mark_invalid(
                    path=_path_str(event.dest_path),
                    is_file=False,
                    session=session,
                )
            case FileDeletedEvent():
                await Source.mark_invalid(
                    path=_path_str(event.dest_path),
                    is_file=True,
                    session=session,
                )
            case DirMovedEvent():
                await Source.move(
                    src_path=_path_str(event.src_path),
                    dest_path=_path_str(event.dest_path),
                    is_file=False,
                    session=session,
                )
            case FileMovedEvent():
                await Source.move(
                    src_path=_path_str(event.src_path),
                    dest_path=_path_str(event.dest_path),
                    is_file=True,
                    session=session,
                )
            case FileModifiedEvent():
                pass  # TODO: Update song(s) associated with this source
            case _:
                print(
                    f"*** Ignoring event: {event}",
                    file=sys.stderr,
                )


def _worker_main(events: multiprocessing.Queue):
    logging.debug("Library watcher process started")
    while True:
        event: _LibraryEvent | FileSystemEvent = events.get()
        asyncio.run(_process_event(event))


class _WorkerEventHandler(FileSystemEventHandler):
    def __init__(
        self,
        event_queue: multiprocessing.Queue,
    ):
        self._event_queue: multiprocessing.Queue = event_queue
        """
        Queue used to forward file system events to the worker child process.
        """

    @override
    def on_any_event(self, event):
        self._event_queue.put(event)


class LibraryWatcher:
    def __init__(
        self,
        event_queue: multiprocessing.Queue,
    ):
        self._event_queue: multiprocessing.Queue = event_queue
        """
        Queue used to forward file system events to the worker child process.
        """

    def sync_library(self, library_id: int):
        """
        Enqueue a request to sync a library.
        """
        self._event_queue.put(_SyncLibraryEvent(library_id))


_library_watcher: LibraryWatcher | None = None


def get_library_watcher() -> LibraryWatcher | None:
    return _library_watcher


@contextmanager
def library_watcher():
    if (
        config.watch_library
        and config.library_home.scheme == "file"
        and config.library_home.path != "/"
    ):
        library_home_path = Path.from_uri(str(config.library_home))
        if library_home_path.exists() and library_home_path.is_dir():
            event_queue = multiprocessing.Queue()
            worker_process = multiprocessing.Process(
                target=_worker_main,
                args=(event_queue,),
            )
            worker_process.start()

            event_handler = _WorkerEventHandler(event_queue)
            observer = Observer()
            observer.schedule(
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
            observer.start()
            try:
                global _library_watcher
                _library_watcher = LibraryWatcher(event_queue)
                yield
            finally:
                _library_watcher = None
                observer.stop()
                observer.join()
                worker_process.terminate()
        else:
            logging.warning(
                f"*** library_home refers to directory that does not exist: {config.library_home}"
            )
            yield
    else:
        yield
