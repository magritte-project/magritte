from sqlmodel import Field

from magritte.model.base import LibraryModel
from magritte.schemas.playback_event import PlaybackEventKind


class PlaybackEvent(LibraryModel, table=True):
    __tablename__: str = "playback_events"

    kind: PlaybackEventKind = Field(
        description="The kind of event which happened",
    )
    user_id: int = Field(
        foreign_key="users.id",
        index=True,
        ondelete="CASCADE",
        description="ID of the user involved in this playback event",
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
