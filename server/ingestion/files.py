import os
import pathlib
import sys
from mimetypes import guess_file_type

from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col
from tinytag import TinyTag, UnsupportedFormatError

from ingestion.artwork import try_ingest_artwork
from model.album import Album
from model.artist import Artist
from model.library import Library
from model.song import Song
from model.source import Source
from schemas.artwork import ArtworkKind


async def update_song_metadata(
    song: Song,
    tags: TinyTag,
    libraries: list[Library],
    session: AsyncSession,
):
    artist_name = tags.artist or ""
    artist = await Artist.read_or_insert(artist_name, libraries, session)

    album_title = tags.album or ""
    album = await Album.read_or_insert(album_title, artist.id, libraries, session)

    cover_image = tags.images.any
    if cover_image:
        cover_artwork = await try_ingest_artwork(
            cover_image,
            ArtworkKind.FRONT_COVER,
            session,
        )
        (await song.awaitable_attrs.artworks).append(cover_artwork)

    song.artist = artist
    song.album = album
    song.end_time = tags.duration
    song.title = tags.title
    song.album_artist = tags.albumartist
    song.composer = tags.composer
    song.genre = tags.genre
    song.release_date = tags.year
    song.track_number = tags.track
    song.track_total = tags.track_total
    song.disc_number = tags.disc
    song.disc_total = tags.disc_total
    all_lyrics = tags.other.get("lyrics")
    if all_lyrics is not None:
        song.lyrics = all_lyrics[0]
    song.comment = tags.comment
    all_isrc = tags.other.get("isrc")
    if all_isrc is not None:
        song.isrc = all_isrc[0]


async def try_ingest_file(
    path: str,
    libraries: list[Library],
    session: AsyncSession,
):
    try:
        tags = TinyTag.get(path, image=True)
    except UnsupportedFormatError:
        return None

    file_url = pathlib.Path(path).as_uri()
    already_exists = await Source.exists(
        where=[col(Source.url) == file_url],
        joins=[],
        session=session,
    )
    if already_exists:
        raise FileExistsError("File has already been ingested")

    mime_type, _encoding = guess_file_type(path)

    new_song = Song(
        libraries=libraries,
        sources=[
            Source(
                url=file_url,
                mime_type=mime_type,
            )
        ],
        end_time=tags.duration,
    )
    session.add(new_song)
    await session.flush()

    await update_song_metadata(new_song, tags, libraries, session)

    return new_song


async def try_ingest_path(
    path: str,
    follow_links: bool,
    libraries: list[Library],
    session: AsyncSession,
):
    if os.path.isfile(path):
        await try_ingest_file(path, libraries, session)
    else:
        for dirpath, _, filenames in os.walk(
            path,
            followlinks=follow_links,
        ):
            for filename in filenames:
                if filename.startswith("."):
                    continue

                file_path = os.path.join(dirpath, filename)
                try:
                    new_song = await try_ingest_file(
                        path=file_path,
                        libraries=libraries,
                        session=session,
                    )
                    if not new_song:
                        continue
                    print(
                        f"Added '{filename}': '{new_song.title}' from '{new_song.album_title}' by '{new_song.artist_name}'"
                    )
                except Exception as e:
                    print(f"*** Skipping {file_path}: {e}", file=sys.stderr)
