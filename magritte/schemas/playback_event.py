from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field


class PlaybackEventKind(str, Enum):
    PLAY = "play"
    PAUSE = "pause"
    STOP = "stop"
    FAST_FORWARD = "fast_forward"
    REWIND = "rewind"


class IngestPlaybackEvent(BaseModel):
    kind: Annotated[
        PlaybackEventKind, Field(description="The kind of event which happened")
    ]
    song_id: Annotated[
        int, Field(description="ID of the song involved in this playback event")
    ]
    start_time: Annotated[
        int, Field(description="The current time in the song when the event started")
    ]
    end_time: Annotated[
        int, Field(description="The current time in the song when the event ended")
    ]


class PlaybackEventIngestResult(BaseModel):
    accepted_count: int
    rejected_events: list[IngestPlaybackEvent]


class PlaybackEventRead(BaseModel):
    id: Annotated[int, Field()]
    kind: Annotated[
        PlaybackEventKind, Field(description="The kind of event which happened")
    ]
    song_id: Annotated[
        int, Field(description="ID of the song involved in this playback event")
    ]
    start_time: Annotated[
        int, Field(description="The current time in the song when the event started")
    ]
    end_time: Annotated[
        int, Field(description="The current time in the song when the event ended")
    ]
