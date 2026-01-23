import asyncio
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import TYPE_CHECKING

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
from ingestion.canon import Canonizer
from ingestion.files import try_ingest_path
from model import Library
from model.source import Source
from utilities.user_events import UserEvent, UserEventType
from worker.events import (
    LibraryWorkerEvent,
    NotifyUsersParentRequest,
    SyncLibraryWorkerEvent,
)

if TYPE_CHECKING:
    from multiprocessing.connection import Connection


logger = logging.getLogger("LibraryWorker")


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


async def _process_event(
    connection: "Connection",
    event: LibraryWorkerEvent | FileSystemEvent,
):
    logger.debug(f"Processing event: {event}")
    async with _db_session() as session:
        match event:
            case SyncLibraryWorkerEvent():
                library = await session.get_one(Library, event.library_id)
                if library.home_path is None:
                    raise ValueError(f"Library is streaming only '{event.library_id}'")

                library_home_path = config.library_home_path.joinpath(library.home_path)
                canonizer = Canonizer.from_file()
                await try_ingest_path(
                    path=library_home_path,
                    follow_links=False,
                    libraries=[library],
                    canonizer=canonizer,
                    session=session,
                )
                connection.send(
                    NotifyUsersParentRequest(
                        user_ids={
                            user.id for user in await library.awaitable_attrs.users
                        },
                        event=UserEvent(
                            event_type=UserEventType.LIBRARIES_CHANGED,
                            ids=[library.id],
                        ),
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
                logger.error(f"*** Ignoring event: {event}")


def worker_main(connection: "Connection"):
    logging.basicConfig(level=config.logging_level)

    try:
        logger.debug("Process started")
        while True:
            event: LibraryWorkerEvent | FileSystemEvent = connection.recv()
            asyncio.run(_process_event(connection, event))
    except KeyboardInterrupt:
        logger.debug("Process interrupted")
    finally:
        connection.close()
