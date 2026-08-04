import asyncio
import logging
import os
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

from magritte.config import config
from magritte.db import get_db_engine, get_db_session
from magritte.ingestion.canon import Canonizer
from magritte.ingestion.files import pre_ingest_file, try_ingest_path
from magritte.model import Library
from magritte.model.source import Source
from magritte.utilities.user_events import UserEvent, UserEventType
from magritte.worker.events import (
    IngestFilesLibraryWorkerEvent,
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


def _send_notifications_changed(
    connection: "Connection",
    user_ids_to_notify: set[int],
):
    connection.send(
        NotifyUsersParentRequest(
            user_ids=user_ids_to_notify,
            event=UserEvent(
                event_type=UserEventType.NOTIFICATIONS_CHANGED,
                ids=[],
            ),
        )
    )


def _send_libraries_changed(
    connection: "Connection",
    user_ids_to_notify: set[int],
    library_ids: list[int],
):
    connection.send(
        NotifyUsersParentRequest(
            user_ids=user_ids_to_notify,
            event=UserEvent(
                event_type=UserEventType.LIBRARIES_CHANGED,
                ids=library_ids,
            ),
        )
    )


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

                library_ids = [library.id]
                user_ids_to_notify = {
                    user.id for user in await library.awaitable_attrs.users
                }
                _send_notifications_changed(connection, user_ids_to_notify)
                try:
                    library_home_path = config.music_home_path.joinpath(
                        library.home_path
                    )
                    canonizer = Canonizer.from_file()
                    await try_ingest_path(
                        path=library_home_path,
                        follow_links=False,
                        libraries=[library],
                        canonizer=canonizer,
                        session=session,
                    )
                finally:
                    _send_notifications_changed(connection, user_ids_to_notify)
                    _send_libraries_changed(connection, user_ids_to_notify, library_ids)
            case IngestFilesLibraryWorkerEvent():
                if not config.enable_uploads:
                    raise ValueError("Uploads not enabled")

                library = await session.get_one(Library, event.library_id)
                if library.home_path is None:
                    raise ValueError(f"Library is streaming only '{event.library_id}'")

                canonizer = Canonizer.from_file()
                new_count = 0
                for file in event.files:
                    try:
                        target_directory, filename = pre_ingest_file(
                            Path(file.temp_path),
                            file.reported_filename,
                            file.reported_mime_type,
                            canonizer,
                        )
                        library_home_path = config.music_home_path.joinpath(
                            library.home_path
                        )
                        target_directory_path = library_home_path.joinpath(
                            target_directory
                        )
                        target_directory_path.mkdir(parents=True, exist_ok=True)
                        os.rename(
                            file.temp_path, target_directory_path.joinpath(filename)
                        )

                        new_count += 1
                    except Exception as e:
                        logger.error(f"*** Could not ingest {file}: {e}")
                    finally:
                        if Path(file.temp_path).exists():
                            try:
                                os.remove(file.temp_path)
                            except Exception as e:
                                logger.warning(f"*** Could not clean up {file}: {e}")

                if new_count > 0:
                    await _process_event(
                        connection, SyncLibraryWorkerEvent(event.library_id)
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
