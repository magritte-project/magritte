from sqlalchemy.ext.asyncio import AsyncEngine
from sqlmodel import SQLModel

from .album import Album
from .artist import Artist
from .artwork import Artwork
from .library import Library
from .notification import Notification
from .playback_event import PlaybackEvent
from .song import Song
from .source import Source


async def create_model_tables_if_needed(engine: AsyncEngine):
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


__all__ = [
    "Album",
    "Artist",
    "Artwork",
    "Library",
    "Notification",
    "PlaybackEvent",
    "Song",
    "Source",
]
