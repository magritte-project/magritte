import sys
from contextlib import asynccontextmanager
from pathlib import Path

from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from tinytag import TinyTag, UnsupportedFormatError

from magritte.ingestion.artwork import try_ingest_artwork
from magritte.ingestion.canon import Canonizer
from magritte.ingestion.types import get_mime_types
from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.library import Library
from magritte.model.notification import Notification
from magritte.model.song import Song
from magritte.model.source import Source
from magritte.schemas.artwork import ArtworkKind
from magritte.utilities.files import path_as_file_uri


async def _update_song_metadata(
    song: Song,
    tags: TinyTag,
    libraries: list[Library],
    canonizer: Canonizer,
    session: AsyncSession,
):
    artist_name = canonizer.fix_artist(tags.artist)
    artist = await Artist.read_or_insert(artist_name, libraries, session)

    album_title = canonizer.fix_album(tags.album)
    album = await Album.read_or_insert(
        album_title, artist.id if artist else None, libraries, session
    )

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
    song.end_time = tags.duration or 0
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


async def ensure_libraries_linked(
    source: Source,
    libraries: list[Library],
    session: AsyncSession,
):
    songs: list[Song] = await source.awaitable_attrs.songs
    for song in songs:
        album: Album = await song.awaitable_attrs.album
        if album is not None:
            album.libraries = Library.combine(
                libraries, await album.awaitable_attrs.libraries
            )
        artist: Artist = await song.awaitable_attrs.artist
        if artist is not None:
            artist.libraries = Library.combine(
                libraries, await artist.awaitable_attrs.libraries
            )
        song.libraries = Library.combine(
            libraries, await song.awaitable_attrs.libraries
        )
    await session.flush()


async def _try_ingest_file(
    path: Path,
    libraries: list[Library],
    canonizer: Canonizer,
    session: AsyncSession,
):
    mime_type, _encoding = get_mime_types().guess_file_type(path)
    if not mime_type or not mime_type.startswith("audio"):
        return None

    file_url = path_as_file_uri(path)
    existing_source = await Source.read_one(
        file_url,
        session,
    )
    if existing_source:
        await ensure_libraries_linked(existing_source, libraries, session)
        raise FileExistsError("File has already been ingested")

    try:
        tags = TinyTag.get(path, image=True)
    except UnsupportedFormatError:
        tags = None

    new_song = Song(
        libraries=libraries,
        sources=[
            Source(
                url=file_url,
                mime_type=mime_type,
            )
        ],
    )
    session.add(new_song)
    await session.flush()

    if tags:
        await _update_song_metadata(new_song, tags, libraries, canonizer, session)
    else:
        new_song.title = path.stem

    return new_song


@asynccontextmanager
async def _ingest_notifications(libraries: list[Library], session: AsyncSession):
    notifications = list[Notification]()
    for library in libraries:
        notification = Notification(
            title=f"Updating {library.name}",
            is_locked=True,
            users=await library.awaitable_attrs.users,
        )
        session.add(notification)
        notifications.append(notification)

    await session.commit()
    for library in libraries:
        await session.refresh(library)

    try:
        yield
    except Exception as e:
        if isinstance(e, IntegrityError):
            await session.rollback()
        for library, notification in zip(libraries, notifications):
            await session.refresh(notification)
            notification.title = f"Failed to update {library.name}"
            notification.description = str(e)
            notification.is_locked = False
        await session.commit()
        raise
    else:
        for library, notification in zip(libraries, notifications):
            await session.refresh(notification)
            notification.title = f"Updated {library.name}"
            notification.is_locked = False
            notification.is_read = True
        await session.commit()


async def try_ingest_path(
    path: Path,
    follow_links: bool,
    libraries: list[Library],
    canonizer: Canonizer,
    session: AsyncSession,
):
    async with _ingest_notifications(libraries, session):
        if path.is_file():
            await _try_ingest_file(path, libraries, canonizer, session)
        else:
            for dirpath, _, filenames in path.walk(follow_symlinks=follow_links):
                if dirpath.name.startswith("."):
                    continue

                for filename in filenames:
                    if filename.startswith("."):
                        continue

                    file_path = dirpath / filename
                    try:
                        new_song = await _try_ingest_file(
                            file_path, libraries, canonizer, session
                        )
                        if not new_song:
                            continue
                        print(
                            f"Added '{filename}': '{new_song.title}' from '{new_song.album_title}' by '{new_song.artist_name}'"
                        )
                    except Exception as e:
                        print(f"*** Skipping {file_path}: {e}", file=sys.stderr)
