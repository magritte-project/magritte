import os
import pathlib
import sys
from typing import Callable, Mapping, TypeVar, cast

import mutagen
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

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

    file_url = pathlib.Path(path).as_uri()
    already_exists = (
        await session.scalar(
            select(True).where(
                select(Source).where(col(Source.url) == file_url).exists()
            )
        )
        or False
    )
    if already_exists:
        raise FileExistsError("File has already been ingested")

    mime_type = file.mime[0]

    tags = file.tags
    artist_name = get_only_tag(tags, "ARTIST", str) or ""
    artist = await Artist.read_or_insert(artist_name, session)

    album_title = get_only_tag(tags, "ALBUM", str) or ""
    album = await Album.read_or_insert(album_title, artist.id, session)

    track_number = get_only_tag(tags, "TRACKNUMBER", str)
    track_total = None
    if track_number is not None:
        if "/" in track_number:
            number_and_total = track_number.split("/")
            track_number = int(number_and_total[0])
            track_total = int(number_and_total[1])
        else:
            track_number = int(track_number)

    if track_total is None:
        track_total = get_only_tag(tags, "TRACKTOTAL", int)

    disc_number = get_only_tag(tags, "DISCNUMBER", str)
    disc_total = None
    if disc_number is not None:
        if "/" in disc_number:
            number_and_total = disc_number.split("/")
            disc_number = int(number_and_total[0])
            disc_total = int(number_and_total[1])
        else:
            disc_number = int(disc_number)

    disc_total = get_only_tag(tags, "DISCTOTAL", int)

    new_song = Song(
        artist=artist,
        album=album,
        artworks=[],  # list["Artwork"]
        libraries=[library],
        sources=[
            Source(
                url=file_url,
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
        track_number=track_number,
        track_total=track_total,
        disc_number=disc_number,
        disc_total=disc_total,
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


async def try_ingest_path(
    path: str,
    follow_links: bool,
    library: Library,
    session: AsyncSession,
):
    if os.path.isfile(path):
        await try_ingest_file(path, library, session)
    else:
        for dirpath, _, filenames in os.walk(
            path,
            followlinks=follow_links,
        ):
            for filename in filenames:
                if filename.startswith("."):
                    continue

                # TODO: Skip already seen files
                # TODO: Factor this out so it can be used from watchdog too

                file_path = os.path.join(dirpath, filename)
                try:
                    new_song = await try_ingest_file(
                        path=file_path,
                        library=library,
                        session=session,
                    )
                    print(
                        f"Added '{filename}': '{new_song.title}' from '{new_song.album_title}' by '{new_song.artist_name}'"
                    )
                except Exception as e:
                    print(f"*** Skipping {file_path}: {e}", file=sys.stderr)
