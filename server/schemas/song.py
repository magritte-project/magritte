from enum import Enum
from typing import Any

from pydantic import BaseModel, Field, GetCoreSchemaHandler
from pydantic_core import core_schema

from schemas.artwork import ArtworkRead
from schemas.base import SortOrder
from schemas.source import SourceRead


class SongSortKey(str, Enum):
    ARTIST_NAME = "artist_name"
    ALBUM_TITLE = "album_title"
    TITLE = "title"
    ALBUM_ARTIST = "album_artist"
    COMPOSER = "composer"
    GENRE = "genre"
    RELEASE_DATE = "release_date"
    TRACK_NUMBER = "track_number"
    TRACK_TOTAL = "track_total"
    DISC_NUMBER = "disc_number"
    DISC_TOTAL = "disc_total"
    RATING = "rating"
    BPM = "bpm"
    GROUPING = "grouping"


class SongSort:
    def __init__(self, key: SongSortKey, order: SortOrder):
        self.key: SongSortKey = key
        self.order: SortOrder = order

    @classmethod
    def __get_pydantic_core_schema__(
        cls,
        source_type: Any,
        handler: GetCoreSchemaHandler,
    ):
        allowed_values = list[str]()
        for key in SongSortKey:
            for order in SortOrder:
                allowed_values.append(f"{order._value_}{key._value_}")
        return core_schema.no_info_plain_validator_function(
            cls._validate,
            json_schema_input_schema=core_schema.literal_schema(allowed_values),
            serialization=core_schema.plain_serializer_function_ser_schema(
                cls._serialize,
                return_schema=core_schema.literal_schema(allowed_values),
            ),
        )

    @classmethod
    def _validate(cls, value: Any):
        match value:
            case cls():
                return value
            case str():
                return cls(SongSortKey(value[1:]), SortOrder(value[:1]))
            case _:
                raise ValueError(f"Expected string, got {type(value)}")

    @classmethod
    def _serialize(cls, instance: "SongSort") -> str:
        return f"{instance.order._value_}{instance.key._value_}"


class SongCreate(BaseModel):
    artist_id: int | None
    album_id: int | None
    artwork_ids: list[int]
    source_ids: list[int]
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


class SongUpdate(BaseModel):
    artist_id: int | None = None
    album_id: int | None = None
    artwork_ids: list[int] | None = None
    source_ids: list[int] | None = None
    start_time: float | None = None
    end_time: float | None = None
    title: str | None = None
    album_artist: str | None = None
    composer: str | None = None
    genre: str | None = None
    release_date: str | None = None
    track_number: int | None = None
    track_total: int | None = None
    disc_number: int | None = None
    disc_total: int | None = None
    lyrics: str | None = None
    rating: float | None = None
    bpm: int | None = None
    comment: str | None = None
    grouping: str | None = None
    mcn: str | None = None
    isrc: str | None = None
    music_brainz_release_id: str | None = None
    music_brainz_recording_id: str | None = None


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
