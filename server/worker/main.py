import asyncio
import logging
import multiprocessing
import sys
from contextlib import asynccontextmanager

from watchdog.events import (
    DirDeletedEvent,
    DirMovedEvent,
    FileDeletedEvent,
    FileModifiedEvent,
    FileMovedEvent,
    FileSystemEvent,
)

from config import config
from db import get_db_engine, get_db_session
from ingestion.files import try_ingest_path
from model import Library
from model.source import Source
from worker.events import LibraryEvent, SyncLibraryEvent


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


async def _process_event(event: LibraryEvent | FileSystemEvent):
    logging.debug(f"Library worker processing event: {event}")
    async with _db_session() as session:
        match event:
            case SyncLibraryEvent():
                library = await session.get_one(Library, event.library_id)
                if library.home_path is None:
                    raise ValueError(f"Library is streaming only '{event.library_id}'")

                library_home_path = config.library_home_path.joinpath(library.home_path)
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


def worker_main(events: multiprocessing.Queue):
    logging.debug("Library worker process started")
    while True:
        event: LibraryEvent | FileSystemEvent = events.get()
        asyncio.run(_process_event(event))
