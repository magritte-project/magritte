import asyncio
import multiprocessing
import sys
from contextlib import asynccontextmanager, contextmanager
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
from model.source import Source


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


async def _process_event(event: FileSystemEvent):
    async with _db_session() as session:
        match event:
            case DirDeletedEvent():
                await Source.mark_invalid(
                    path=_path_str(event.dest_path),
                    is_file=False,
                    session=session,
                )
            case DirMovedEvent():
                await Source.move(
                    src_path=_path_str(event.src_path),
                    dest_path=_path_str(event.dest_path),
                    is_file=False,
                    session=session,
                )
            case FileDeletedEvent():
                await Source.mark_invalid(
                    path=_path_str(event.dest_path),
                    is_file=True,
                    session=session,
                )
            case FileModifiedEvent():
                pass  # TODO: Update song(s) associated with this source
            case FileMovedEvent():
                await Source.move(
                    src_path=_path_str(event.src_path),
                    dest_path=_path_str(event.dest_path),
                    is_file=True,
                    session=session,
                )
            case _:
                print(
                    f"*** Ignoring library file system event: {event}",
                    file=sys.stderr,
                )


def _worker_main(events: multiprocessing.Queue):
    while True:
        event: FileSystemEvent = events.get()
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


@contextmanager
def library_watcher():
    if config.watch_library:
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
            config.library_home,
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
            yield
        finally:
            observer.stop()
            observer.join()
            worker_process.terminate()
    else:
        yield
