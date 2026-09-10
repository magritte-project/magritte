from typing import Annotated

from pydantic import BaseModel, Field

from magritte.schemas.artwork import ArtworkKind
from magritte.schemas.base import (
    EMBEDDED_TEXT_MAX_LENGTH,
    TAG_MAX_LENGTH,
    URL_MAX_LENGTH,
)


class IngestArtwork(BaseModel):
    kind: ArtworkKind
    image_url: Annotated[str, Field(max_length=URL_MAX_LENGTH)]
    background_color: str | None
    primary_color: str | None
    secondary_color: str | None
    tertiary_color: str | None


class IngestSource(BaseModel):
    url: Annotated[str, Field(max_length=URL_MAX_LENGTH)]
    mime_type: str | None


class IngestSong(BaseModel):
    artist_name: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    album_title: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    artworks: list[IngestArtwork]
    sources: list[IngestSource]
    start_time: float
    end_time: float
    title: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    album_artist: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    composer: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    genre: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    release_date: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    track_number: int | None
    track_total: int | None
    disc_number: int | None
    disc_total: int | None
    lyrics: Annotated[str | None, Field(max_length=EMBEDDED_TEXT_MAX_LENGTH)]
    rating: float | None
    bpm: int | None
    comment: Annotated[str | None, Field(max_length=EMBEDDED_TEXT_MAX_LENGTH)]
    grouping: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    mcn: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    isrc: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    music_brainz_release_id: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    music_brainz_recording_id: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]


class BulkIngestSongs(BaseModel):
    songs: Annotated[list[IngestSong], Field(max_length=50)]
