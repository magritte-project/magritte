import asyncio
import logging
from contextlib import asynccontextmanager
from multiprocessing.connection import Connection
from pathlib import Path

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
from worker.events import (
    LibraryWorkerEvent,
    SynchedLibraryWorkerReply,
    SyncLibraryWorkerEvent,
)


@asynccontextmanager
async def _db_session():
    engine = await get_db_engine()
    async for session in get_db_session(engine):
        yield session


def _to_path(path: str | bytes):
    match path:
        case str():
            return Path(path)
        case bytes():
            return Path(path.decode())


async def _process_event(conn: Connection, event: LibraryWorkerEvent | FileSystemEvent):
    logging.debug(f"Library worker processing event: {event}")
    async with _db_session() as session:
        match event:
            case SyncLibraryWorkerEvent():
                library = await session.get_one(Library, event.library_id)
                if library.home_path is None:
                    raise ValueError(f"Library is streaming only '{event.library_id}'")

                library_home_path = config.library_home_path.joinpath(library.home_path)
                await try_ingest_path(
                    path=library_home_path,
                    follow_links=False,
                    libraries=[library],
                    session=session,
                )
                conn.send(
                    SynchedLibraryWorkerReply(
                        library_id=event.library_id,
                        affected_user_ids=[
                            user.id for user in await library.awaitable_attrs.users
                        ],
                    )
                )
            case DirDeletedEvent():
                await Source.mark_invalid(
                    path=_to_path(event.dest_path),
                    is_file=False,
                    session=session,
                )
            case FileDeletedEvent():
                await Source.mark_invalid(
                    path=_to_path(event.dest_path),
                    is_file=True,
                    session=session,
                )
            case DirMovedEvent():
                await Source.move(
                    src_path=_to_path(event.src_path),
                    dest_path=_to_path(event.dest_path),
                    is_file=False,
                    session=session,
                )
            case FileMovedEvent():
                await Source.move(
                    src_path=_to_path(event.src_path),
                    dest_path=_to_path(event.dest_path),
                    is_file=True,
                    session=session,
                )
            case FileModifiedEvent():
                pass  # TODO: Update song(s) associated with this source
            case _:
                logging.error(f"*** Ignoring event: {event}")


def worker_main(conn: Connection):
    try:
        logging.debug("Library worker process started")
        while True:
            event: LibraryWorkerEvent | FileSystemEvent = conn.recv()
            asyncio.run(_process_event(conn, event))
    except KeyboardInterrupt:
        logging.debug("Library worker process interrupted")
    finally:
        conn.close()
