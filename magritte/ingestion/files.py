import logging
import os
import secrets
from contextlib import asynccontextmanager
from pathlib import Path

from pathvalidate import sanitize_filename
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col
from tinytag import TinyTag, UnsupportedFormatError

from magritte.ingestion.artwork import try_ingest_artwork
from magritte.ingestion.canon import Canonizer
from magritte.ingestion.types import get_mime_types
from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.ignored_resource import IgnoredResource
from magritte.model.library import Library
from magritte.model.notification import Notification
from magritte.model.song import Song
from magritte.model.source import Source
from magritte.schemas.artwork import ArtworkKind
from magritte.utilities.files import path_as_file_uri

logger = logging.getLogger("Ingestions")


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
        song.artworks = Library.combine(
            [cover_artwork], await song.awaitable_attrs.artworks
        )

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
) -> list[Song]:
    mime_type, _encoding = get_mime_types().guess_file_type(path)
    if not mime_type or not mime_type.startswith("audio"):
        return []

    file_url = path_as_file_uri(path)
    if await IgnoredResource.exists(
        where=[
            col(IgnoredResource.url) == file_url,
            col(IgnoredResource.libraries).any(
                col(Library.id).in_([library.id for library in libraries])
            ),
        ],
        joins=[],
        session=session,
    ):
        raise FileExistsError("File ignored by user")

    try:
        tags = TinyTag.get(path, image=True)
        # NOTE: If TinyTag is able to infer a mime type, this will be more
        #       accurate than what we get from the file's extension above.
        if tags.mime_type is not None:
            mime_type = tags.mime_type
    except UnsupportedFormatError:
        tags = None

    existing_source = await Source.read_one(
        file_url,
        session,
    )

    songs = list[Song]()
    if existing_source:
        await ensure_libraries_linked(existing_source, libraries, session)

        songs += [
            song
            for song in await existing_source.awaitable_attrs.songs
            if not song.has_altered_metadata
        ]
    else:
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

        songs.append(new_song)

    for song in songs:
        if tags:
            await _update_song_metadata(song, tags, libraries, canonizer, session)
        else:
            song.title = path.stem

    return songs


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
        for notification in notifications:
            await session.delete(notification)
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
                        affected_songs = await _try_ingest_file(
                            file_path, libraries, canonizer, session
                        )
                        if not affected_songs:
                            logger.info(
                                f"Skipped {file_path}: no songs inserted or updated"
                            )
                            continue
                        specimen_song = affected_songs[0]
                        logger.info(
                            f"Processed '{filename}': '{specimen_song.title}' from '{specimen_song.album_title}' by '{specimen_song.artist_name}'"
                        )
                    except Exception as e:
                        logger.warning(f"*** Skipping {file_path}: {e}")


def _resolve_uploaded_file_mime_type(
    tags: TinyTag,
    reported_filename: str | None,
    reported_mime_type: str | None,
):
    if tags.mime_type is not None:
        return tags.mime_type

    if reported_mime_type is not None:
        return reported_mime_type

    if reported_filename is not None:
        mime_type, _encoding = get_mime_types().guess_file_type(reported_filename)
        return mime_type

    return None


def pre_ingest_uploaded_file(
    library_home_path: Path,
    temp_path: str,
    reported_filename: str | None,
    reported_mime_type: str | None,
    canonizer: Canonizer,
):
    try:
        tags = TinyTag.get(temp_path, image=False)

        mime_type = _resolve_uploaded_file_mime_type(
            tags, reported_filename, reported_mime_type
        )
        if mime_type is None:
            raise UnsupportedFormatError("Unsupported mime type")

        extension = get_mime_types().guess_extension(mime_type)
        if extension is None:
            raise ValueError("Could not resolve extension")

        track_number = tags.track or 0
        title = sanitize_filename(tags.title or "Unknown Title")
        artist_name = sanitize_filename(
            canonizer.fix_artist(tags.artist) or "Unknown Artist"
        )
        album_title = sanitize_filename(
            canonizer.fix_album(tags.album) or "Unknown Album"
        )

        target_directory_path = library_home_path.joinpath(artist_name, album_title)

        filename = f"{track_number} {title}{extension}"
        while target_directory_path.joinpath(filename).exists():
            filename = f"{track_number} {title} ({secrets.token_hex(4)}){extension}"

        destination_path = target_directory_path.joinpath(filename)

        target_directory_path.mkdir(parents=True, exist_ok=True)
        os.rename(temp_path, destination_path)

        logger.info(f"Copied uploaded file from {temp_path} to {destination_path}")

        return target_directory_path
    except:
        try:
            os.remove(temp_path)
        except Exception as e:
            logger.error(f"*** Could not clean up {temp_path}: {e}")
        raise
