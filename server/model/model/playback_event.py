from enum import Enum

from sqlmodel import Field

from model.base import LibraryModel


class PlaybackEventKind(str, Enum):
    PLAY = "play"
    PAUSE = "pause"
    STOP = "stop"
    FAST_FORWARD = "fast_forward"
    REWIND = "rewind"


class PlaybackEvent(LibraryModel, table=True):
    __tablename__: str = "playback_events"

    kind: PlaybackEventKind = Field(
        description="The kind of event which happened",
    )
    song_id: int = Field(
        foreign_key="songs.id",
        description="ID of the song involved in this playback event",
    )
    start_time: int = Field(
        description="The current time in the song when the event started",
    )
    end_time: int = Field(
        description="The current time in the song when the event ended",
    )
