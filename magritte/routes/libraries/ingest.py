from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Security,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import and_, col

from magritte.auth import get_current_user
from magritte.config import config
from magritte.db import get_db_session
from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.artwork import Artwork
from magritte.model.library import Library
from magritte.model.song import Song
from magritte.model.source import Source
from magritte.model.user import User
from magritte.schemas.artwork import ArtworkRead
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.base import OperationResult
from magritte.schemas.ingest import BulkIngestSongs
from magritte.schemas.song import SongRead
from magritte.schemas.source import SourceRead
from magritte.worker import ingest_uploaded_files, sync_library

router = APIRouter()


@router.post(
    "/{library_id}/ingest/files",
    response_model=OperationResult,
    summary="Bulk ingest uploaded files",
)
async def ingest_files(
    library_id: int,
    files: list[UploadFile],
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if len(files) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many files",
        )

    if any(file.size > config.upload_max_file_size for file in files):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large",
        )

    if not config.enable_uploads:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploads are disabled",
        )

    if not await Library.can_user_access_by_id(
        library_id,
        current_user.id,
        session,
        can_add=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    await ingest_uploaded_files(library_id, files)

    return OperationResult(message="Ingesting files")


@router.post(
    "/{library_id}/ingest/songs",
    response_model=list[SongRead],
    summary="Bulk ingest new songs without uploading files",
)
async def ingest_songs(
    library_id: int,
    batch: BulkIngestSongs,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if not await Library.can_user_access_by_id(
        library_id,
        current_user.id,
        session,
        can_add=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    library = await session.get_one(Library, library_id)
    new_songs = list[Song]()
    for create_song in batch.songs:
        if create_song.artist_name is not None:
            artist, inserted = await Artist(
                name=create_song.artist_name,
                libraries=[library],
            ).try_insert_unique(
                col(Artist.name) == create_song.artist_name,
                session,
            )
            if not inserted:
                await session.refresh(library)  # for rollback
                artist.libraries = Library.combine(
                    await artist.awaitable_attrs.libraries, [library]
                )
        else:
            artist = None
        if create_song.album_title is not None:
            artist_id = artist.id if artist else None
            album, inserted = await Album(
                title=create_song.album_title,
                artist_id=artist_id,
                libraries=[library],
            ).try_insert_unique(
                and_(
                    col(Album.title) == create_song.album_title,
                    col(Album.artist_id) == artist_id,
                ),
                session,
            )
            if not inserted:
                await session.refresh(library)  # for rollbacks
                album.libraries = Library.combine(
                    await album.awaitable_attrs.libraries, [library]
                )
        else:
            album = None

        artworks = list[Artwork]()
        for create_artwork in create_song.artworks:
            create_artwork_image_hash = Artwork.create_image_hash(
                create_artwork.image_url.encode("utf-8")
            )
            artwork, inserted = await Artwork(
                kind=create_artwork.kind,
                image_hash=create_artwork_image_hash,
                image_url=create_artwork.image_url,
                background_color=create_artwork.background_color,
                primary_color=create_artwork.primary_color,
                secondary_color=create_artwork.secondary_color,
                tertiary_color=create_artwork.tertiary_color,
            ).try_insert_unique(
                and_(
                    col(Artwork.kind) == create_artwork.kind,
                    col(Artwork.image_hash) == create_artwork_image_hash,
                ),
                session,
            )
            if not inserted:
                artwork.background_color = create_artwork.background_color
                artwork.primary_color = create_artwork.primary_color
                artwork.secondary_color = create_artwork.secondary_color
                artwork.tertiary_color = create_artwork.tertiary_color
            artworks.append(artwork)

        sources = list[Source]()
        for create_source in create_song.sources:
            source, inserted = await Source(
                url=create_source.url,
                mime_type=create_source.mime_type,
                extension_manifest_id=create_source.extension_manifest_id,
                extension_tag=create_source.extension_tag,
            ).try_insert_unique(
                col(Source.url) == create_source.url,
                session,
            )
            if not inserted:
                source.mime_type = create_source.mime_type
                source.is_invalid = False
                source.extension_manifest_id = create_source.extension_manifest_id
                source.extension_tag = create_source.extension_tag
            sources.append(source)

        new_song = Song(
            artist=artist,
            album=album,
            artworks=artworks,
            sources=sources,
            start_time=create_song.start_time,
            end_time=create_song.end_time,
            title=create_song.title,
            album_artist=create_song.album_artist,
            composer=create_song.composer,
            genre=create_song.genre,
            release_date=create_song.release_date,
            track_number=create_song.track_number,
            track_total=create_song.track_total,
            disc_number=create_song.disc_number,
            disc_total=create_song.disc_total,
            lyrics=create_song.lyrics,
            rating=create_song.rating,
            bpm=create_song.bpm,
            comment=create_song.comment,
            grouping=create_song.grouping,
            mcn=create_song.mcn,
            isrc=create_song.isrc,
            music_brainz_release_id=create_song.music_brainz_release_id,
            music_brainz_recording_id=create_song.music_brainz_recording_id,
            libraries=[library],
        )
        session.add(new_song)
        new_songs.append(new_song)
        await session.flush()

    return [
        SongRead(
            **new_song.model_dump(),
            artworks=[
                ArtworkRead(**artwork.model_dump())
                for artwork in await new_song.awaitable_attrs.artworks
            ],
            sources=[
                SourceRead(**source.model_dump())
                for source in await new_song.awaitable_attrs.sources
            ],
        )
        for new_song in new_songs
    ]


@router.post(
    "/{library_id}/sync",
    response_model=OperationResult,
    summary="Request that a library sync its songs with the file system",
)
async def request_sync_library(
    library_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.LIBRARIES_WRITE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    background_tasks: BackgroundTasks,
):
    if not await Library.can_user_access_by_id(
        library_id,
        current_user.id,
        session,
        can_add=True,
        can_edit=True,
        can_remove=True,
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Library not found"
        )

    background_tasks.add_task(sync_library, library_id)

    return OperationResult(
        message="Sync request received",
        row_count=1,
    )
