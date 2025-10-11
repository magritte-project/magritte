import pathlib
from typing import Callable, Mapping, TypeVar, cast

import mutagen
from sqlalchemy.ext.asyncio import AsyncSession

from model.album import Album
from model.artist import Artist
from model.library import Library
from model.song import Song
from model.source import Source

_T = TypeVar("_T")


def get_only_tag(
    tags: mutagen.Tags, name: str, conversion: Callable[[str], _T]
) -> _T | None:
    values = cast(Mapping[str, str], tags).get(name, [])
    if not values:
        return None
    if len(values) > 1:
        raise ValueError(f"More than one value for tag {name} in {tags}")
    return conversion(values[0])


async def try_ingest_file(
    path: str,
    library: Library,
    session: AsyncSession,
):
    file = mutagen.File(path, easy=True)
    if file is None:
        raise TypeError("Unsupported file")

    mime_type = file.mime[0]

    tags = file.tags
    artist_name = get_only_tag(tags, "ARTIST", str) or ""
    artist = await Artist.read_or_insert(artist_name, session)

    album_title = get_only_tag(tags, "ALBUM", str) or ""
    album = await Album.read_or_insert(album_title, artist.id, session)

    new_song = Song(
        artist=artist,
        album=album,
        artworks=[],  # list["Artwork"]
        libraries=[library],
        sources=[
            Source(
                url=pathlib.Path(path).as_uri(),
                mime_type=mime_type,
            )
        ],
        start_time=0,
        end_time=file.info.length,
        title=get_only_tag(tags, "TITLE", str),
        album_artist=get_only_tag(tags, "ALBUMARTIST", str),
        composer=get_only_tag(tags, "COMPOSER", str),
        genre=get_only_tag(tags, "GENRE", str),
        release_date=get_only_tag(tags, "DATE", str),
        track_number=get_only_tag(tags, "TRACKNUMBER", int),
        track_total=get_only_tag(tags, "TRACKTOTAL", int),
        disc_number=get_only_tag(tags, "DISCNUMBER", int),
        disc_total=get_only_tag(tags, "DISCTOTAL", int),
        lyrics=get_only_tag(tags, "LYRICS", str),
        rating=None,
        bpm=None,
        comment=None,
        grouping=None,
        mcn=None,
        isrc=get_only_tag(tags, "ISRC", str),
        music_brainz_release_id=None,
        music_brainz_recording_id=None,
    )
    session.add(new_song)
    await session.flush()
    return new_song
