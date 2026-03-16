from typing import TYPE_CHECKING, Any, Union, assert_never, override

from pydantic import computed_field
from sqlalchemy import UnaryExpression
from sqlalchemy.orm import Mapped
from sqlmodel import Field, Relationship, SQLModel, col

from magritte.model.base import LibraryModel
from magritte.schemas.base import SortOrder
from magritte.schemas.song import SongSortKey

if TYPE_CHECKING:
    from .album import Album
    from .artist import Artist
    from .artwork import Artwork
    from .library import Library
    from .source import Source


class SongArtworkLink(SQLModel, table=True):
    __tablename__: str = "song_artwork_links"

    song_id: int | None = Field(
        default=None,
        foreign_key="songs.id",
        primary_key=True,
    )
    artwork_id: int | None = Field(
        default=None,
        foreign_key="artworks.id",
        primary_key=True,
    )


class SongLibraryLink(SQLModel, table=True):
    __tablename__: str = "song_library_links"

    song_id: int | None = Field(
        default=None,
        foreign_key="songs.id",
        primary_key=True,
    )
    library_id: int | None = Field(
        default=None,
        foreign_key="libraries.id",
        primary_key=True,
    )


class SongSourceLink(SQLModel, table=True):
    __tablename__: str = "song_source_link"

    song_id: int | None = Field(
        default=None,
        foreign_key="songs.id",
        primary_key=True,
    )
    source_id: int | None = Field(
        default=None,
        foreign_key="sources.id",
        primary_key=True,
    )


class Song(LibraryModel, table=True):
    __tablename__: str = "songs"

    artist_id: int | None = Field(
        default=None,
        foreign_key="artists.id",
        description="ID of this song's artist, if any",
    )
    artist: Union["Artist", None] = Relationship(
        back_populates="songs",
        sa_relationship_kwargs={
            "lazy": "joined",
        },
    )
    album_id: int | None = Field(
        default=None,
        foreign_key="albums.id",
        description="ID of this song's album, if any",
    )
    album: Union["Album", None] = Relationship(
        back_populates="songs",
        sa_relationship_kwargs={"lazy": "joined"},
    )
    artworks: list["Artwork"] = Relationship(
        back_populates="songs",
        link_model=SongArtworkLink,
    )
    libraries: list["Library"] = Relationship(
        back_populates="songs",
        link_model=SongLibraryLink,
    )
    sources: list["Source"] = Relationship(
        back_populates="songs",
        link_model=SongSourceLink,
    )

    start_time: float = Field(
        default=0,
        description="Where in the song to start playback",
    )

    end_time: float = Field(
        default=0,
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

    @computed_field
    @property
    def artist_name(self) -> str | None:
        return self.artist.name if self.artist else None

    @computed_field
    @property
    def album_title(self) -> str | None:
        return self.album.title if self.album else None

    @override
    @classmethod
    def query_str_fields(cls) -> list[Mapped[str] | Mapped[str | None]]:
        from .album import Album
        from .artist import Artist

        return [
            col(Artist.name),
            col(Album.title),
            col(Song.title),
            col(Song.album_artist),
            col(Song.composer),
            col(Song.genre),
            col(Song.lyrics),
            col(Song.comment),
            col(Song.grouping),
        ]

    @classmethod
    def _col_for_sort_key(cls, sort_key: SongSortKey) -> Mapped[Any]:
        from .album import Album
        from .artist import Artist

        match sort_key:
            case SongSortKey.ARTIST_NAME:
                return col(Artist.name)
            case SongSortKey.ALBUM_TITLE:
                return col(Album.title)
            case SongSortKey.TITLE:
                return col(cls.title)
            case SongSortKey.ALBUM_ARTIST:
                return col(cls.album_artist)
            case SongSortKey.COMPOSER:
                return col(cls.composer)
            case SongSortKey.GENRE:
                return col(cls.genre)
            case SongSortKey.RELEASE_DATE:
                return col(cls.release_date)
            case SongSortKey.TRACK_NUMBER:
                return col(cls.track_number)
            case SongSortKey.TRACK_TOTAL:
                return col(cls.track_total)
            case SongSortKey.DISC_NUMBER:
                return col(cls.disc_number)
            case SongSortKey.DISC_TOTAL:
                return col(cls.disc_total)
            case SongSortKey.RATING:
                return col(cls.rating)
            case SongSortKey.BPM:
                return col(cls.bpm)
            case SongSortKey.GROUPING:
                return col(cls.grouping)
            case _:
                assert_never(sort_key)

    @classmethod
    def order_for_sort_key(
        cls,
        sort_key: SongSortKey,
        sort_order: SortOrder,
    ) -> UnaryExpression[Any]:
        sort_col = cls._col_for_sort_key(sort_key)
        match sort_order:
            case SortOrder.ASCENDING:
                return sort_col.asc()
            case SortOrder.DESCENDING:
                return sort_col.desc()
