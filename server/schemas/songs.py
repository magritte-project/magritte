from pydantic import BaseModel, Field

from schemas.artwork import ArtworkRead
from schemas.sources import SourceRead


class SongRead(BaseModel):
    id: int

    artist_id: int | None = Field(
        default=None,
        description="ID of this song's artist, if any",
    )
    artist_name: str | None = Field(
        default=None,
        description="Name of this song's song, if any",
    )
    album_id: int | None = Field(
        default=None,
        description="ID of this song's album, if any",
    )
    album_title: str | None = Field(
        default=None,
        description="Title of this song's album, if any",
    )

    artworks: list[ArtworkRead] = Field(
        default_factory=lambda: [],
        description="The artworks of this song",
    )
    sources: list[SourceRead] = Field(
        default_factory=lambda: [],
        description="The sources of this song",
    )

    start_time: float = Field(
        default=0,
        description="Where in the song to start playback",
    )

    end_time: float = Field(
        description="Where in the song to end playback",
    )

    title: str | None = Field(
        default=None,
        description="The title of the song",
    )
    album_artist: str | None = Field(
        default=None,
        description="The song's album artist",
    )
    composer: str | None = Field(
        default=None,
        description="The composer of the song",
    )
    genre: str | None = Field(
        default=None,
        description="The genre of the song",
    )
    release_date: str | None = Field(
        default=None,
        description="The release date of the song",
    )
    track_number: int | None = Field(
        default=None,
        ge=0,
        description="The track number of the song",
    )
    track_total: int | None = Field(
        default=None,
        ge=0,
        description="The total number of tracks on the album",
    )
    disc_number: int | None = Field(
        default=None,
        ge=0,
        description="The disc number in the album",
    )
    disc_total: int | None = Field(
        default=None,
        ge=0,
        description="The total number of discs in the album",
    )
    lyrics: str | None = Field(
        default=None,
        description="The lyrics of the song",
    )
    rating: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="The rating of the song",
    )
    bpm: int | None = Field(
        default=None,
        ge=0,
        description="The beats per minute of the song",
    )
    comment: str | None = Field(
        default=None,
        description="A user defined comment",
    )
    grouping: str | None = Field(
        default=None,
        description="The grouping of the song",
    )
    mcn: str | None = Field(
        default=None,
    )
    isrc: str | None = Field(
        default=None,
    )
    music_brainz_release_id: str | None = Field(
        default=None,
    )
    music_brainz_recording_id: str | None = Field(
        default=None,
    )
