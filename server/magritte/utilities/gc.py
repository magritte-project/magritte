from sqlalchemy.ext.asyncio import AsyncSession

from magritte.model.album import Album
from magritte.model.artist import Artist
from magritte.model.artwork import Artwork
from magritte.model.source import Source


async def garbage_collect(session: AsyncSession):
    """
    Clear any models which are no longer referenced
    by another top level model like `Song`.
    """
    await Album.delete_orphans(session)
    await Artist.delete_orphans(session)
    await Artwork.delete_orphans(session)
    await Source.delete_orphans(session)
    await session.commit()
