from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from model.base import LibraryModel

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


class SourceArtworkLink(SQLModel, table=True):
    __tablename__: str = "source_artwork_links"

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
    artist: "Artist | None" = Relationship(back_populates="songs")
    album_id: int | None = Field(
        default=None,
        foreign_key="albums.id",
        description="ID of this song's album, if any",
    )
    album: "Album | None" = Relationship(back_populates="songs")
    artworks: list["Artwork"] = Relationship(
        back_populates="songs",
        link_model=SongArtworkLink,
    )
    libraries: list["Library"] = Relationship(
        back_populates="songs",
        link_model=SongLibraryLink,
    )
    sources: list["Source"] = Relationship(
        back_populates="sources",
        link_model=SourceArtworkLink,
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
