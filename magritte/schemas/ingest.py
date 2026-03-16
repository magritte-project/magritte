from typing import Annotated

from pydantic import BaseModel, Field

from magritte.schemas.artwork import ArtworkKind


class IngestArtwork(BaseModel):
    kind: ArtworkKind
    image_url: str
    background_color: str | None
    primary_color: str | None
    secondary_color: str | None
    tertiary_color: str | None


class IngestSource(BaseModel):
    url: str
    mime_type: str | None


class IngestSong(BaseModel):
    artist_name: str | None
    album_title: str | None
    artworks: list[IngestArtwork]
    sources: list[IngestSource]
    start_time: float
    end_time: float
    title: str | None
    album_artist: str | None
    composer: str | None
    genre: str | None
    release_date: str | None
    track_number: int | None
    track_total: int | None
    disc_number: int | None
    disc_total: int | None
    lyrics: str | None
    rating: float | None
    bpm: int | None
    comment: str | None
    grouping: str | None
    mcn: str | None
    isrc: str | None
    music_brainz_release_id: str | None
    music_brainz_recording_id: str | None


class BulkIngestSongs(BaseModel):
    songs: Annotated[list[IngestSong], Field(max_length=50)]
