import os
import pathlib
import sys
from mimetypes import guess_file_type
from typing import Callable, Mapping, TypeVar, cast

import mutagen
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select
from tinytag import TinyTag, UnsupportedFormatError

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
    try:
        tags = TinyTag.get(path, image=True)
    except UnsupportedFormatError:
        return None

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

    mime_type, _encoding = guess_file_type(path)

    artist_name = tags.artist or ""
    artist = await Artist.read_or_insert(artist_name, session)

    album_title = tags.album or ""
    album = await Album.read_or_insert(album_title, artist.id, session)

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
        end_time=tags.duration,
        title=tags.title,
        album_artist=tags.albumartist,
        composer=tags.composer,
        genre=tags.genre,
        release_date=tags.year,
        track_number=tags.track,
        track_total=tags.track_total,
        disc_number=tags.disc,
        disc_total=tags.disc_total,
        lyrics=tags.other.get("lyrics")[0] if tags.other.get("lyrics") else None,
        rating=None,
        bpm=None,
        comment=tags.comment,
        grouping=None,
        mcn=None,
        isrc=tags.other.get("isrc")[0] if tags.other.get("isrc") else None,
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
