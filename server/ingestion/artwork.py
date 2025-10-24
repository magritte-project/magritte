import hashlib
import mimetypes
import os
import pathlib

import tinytag
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

import config
from model.artwork import Artwork
from schemas.artwork import ArtworkKind


def _image_hash(image: tinytag.Image):
    sha256 = hashlib.sha256()
    sha256.update(image.data)
    return sha256.hexdigest()


async def try_ingest_artwork(
    image: tinytag.Image,
    kind: ArtworkKind,
    session: AsyncSession,
):
    image_hash = _image_hash(image)

    existing_artwork = await session.scalar(
        select(Artwork).where(
            col(Artwork.kind) == kind,
            col(Artwork.image_hash) == image_hash,
        )
    )
    if existing_artwork:
        return existing_artwork

    extension = mimetypes.guess_extension(image.mime_type) if image.mime_type else None
    image_name = f"{image_hash}{extension}" if extension else image_hash
    image_path = os.path.join(config.COVER_STORE, image_name)

    with open(image_path, "wb") as image_file:
        image_file.write(image.data)

    image_url = pathlib.Path(image_path).as_uri()
    new_artwork = Artwork(
        kind=kind,
        image_hash=image_hash,
        image_url=image_url,
    )
    session.add(new_artwork)
    await session.flush()
    return new_artwork
