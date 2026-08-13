from typing import Annotated

from fastapi import APIRouter, Body, Depends, Security
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from magritte.auth import get_current_user
from magritte.db import get_db_session
from magritte.model import Library, Song
from magritte.model.playback_event import PlaybackEvent
from magritte.model.user import User, UserLibraryLink
from magritte.schemas.playback_event import (
    IngestPlaybackEvent,
    PlaybackEventIngestResult,
)

router = APIRouter(prefix="/playback-events")


@router.post(
    "/ingest",
    response_model=PlaybackEventIngestResult,
    summary="Ingest new playback events",
)
async def ingest_playback_events(
    ingestable_events: Annotated[list[IngestPlaybackEvent], Body(max_length=50)],
    current_user: Annotated[User, Security(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    existant_song_ids = set(
        await session.scalars(
            select(col(Song.id)).where(
                col(Song.id).in_(
                    ingestable_event.song_id for ingestable_event in ingestable_events
                ),
                col(Song.libraries).any(
                    col(Library.users).any(
                        col(UserLibraryLink.user_id) == current_user.id
                    )
                ),
            )
        )
    )

    accepted_count = 0
    rejected_events = list[IngestPlaybackEvent]()
    for ingestable_event in ingestable_events:
        if ingestable_event.song_id not in existant_song_ids:
            rejected_events.append(ingestable_event)
        else:
            new_playback_event = PlaybackEvent(
                kind=ingestable_event.kind,
                user_id=current_user.id,
                song_id=ingestable_event.song_id,
                start_time=ingestable_event.start_time,
                end_time=ingestable_event.end_time,
            )
            session.add(new_playback_event)
            accepted_count += 1

    await session.flush()

    return PlaybackEventIngestResult(
        accepted_count=accepted_count,
        rejected_events=rejected_events,
    )
