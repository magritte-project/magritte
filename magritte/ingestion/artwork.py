import mimetypes
import os
import sys
from typing import cast

import tinytag
from PIL import Image
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select

from magritte.config import config
from magritte.model.artwork import Artwork
from magritte.schemas.artwork import ArtworkKind
from magritte.utilities.files import path_as_file_uri


def find_dominant_image_colors(
    path: os.PathLike,
    palette_size: int,
    color_count: int,
):
    with Image.open(path) as image:
        if image.has_transparency_data:
            # TODO: We can handle images with an alpha channel but no transparent pixels
            raise ValueError("Transparent images not supported")

        sampleable_image = image.copy()
        sampleable_image.thumbnail((100, 100))
        sampleable_image = sampleable_image.convert(mode="RGB")

        paletted_image = sampleable_image.convert(
            mode="P",
            palette=Image.Palette.ADAPTIVE,
            colors=palette_size,
        )
        palette = paletted_image.palette
        if not palette:
            raise ValueError("Could not palletize image")

        indexed_colors = {index: color for color, index in palette.colors.items()}
        color_counts = sorted(paletted_image.getcolors() or [], reverse=True)
        dominant_colors = list[tuple[int, ...]]()
        for _, index in color_counts[:color_count]:
            dominant_colors.append(indexed_colors[cast(int, index)])

        return [
            f"rgb({dominant_color[0]}, {dominant_color[1]}, {dominant_color[2]})"
            for dominant_color in dominant_colors
            if len(dominant_color) == 3
        ]


async def try_ingest_artwork(
    image: tinytag.Image,
    kind: ArtworkKind,
    session: AsyncSession,
):
    image_hash = Artwork.create_image_hash(image.data)

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
    image_path = config.artwork_home_path / image_name

    with open(image_path, "wb") as image_file:
        image_file.write(image.data)

    try:
        colors = find_dominant_image_colors(
            path=image_path,
            palette_size=4,
            color_count=4,
        )
        background_color = colors[0]
        primary_color = colors[1]
        secondary_color = colors[2]
        tertiary_color = colors[3]
    except Exception as e:
        print(
            f"*** Could not find dominant colors for artwork image {image_path}: {e}",
            file=sys.stderr,
        )
        background_color = None
        primary_color = None
        secondary_color = None
        tertiary_color = None

    image_url = path_as_file_uri(image_path)
    new_artwork = Artwork(
        kind=kind,
        image_hash=image_hash,
        image_url=image_url,
        background_color=background_color,
        primary_color=primary_color,
        secondary_color=secondary_color,
        tertiary_color=tertiary_color,
    )
    session.add(new_artwork)
    await session.flush()
    return new_artwork
