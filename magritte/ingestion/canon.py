import logging
from pathlib import Path

from pydantic import BaseModel


class CanonNormalization(BaseModel):
    canonical: str
    alternates: list[str]


class Canon(BaseModel):
    albums: list[CanonNormalization]
    artists: list[CanonNormalization]


class Canonizer:
    @classmethod
    def from_file(
        cls,
        filename: str = "canon.json",
        directory: Path = Path(__file__).absolute().parent,
    ):
        canon_path = directory / filename
        if canon_path.exists():
            cannon_bytes = canon_path.read_bytes()
            canon = Canon.model_validate_json(cannon_bytes)
        else:
            logging.debug("*** Canon file not found, normalization will be disabled")
            canon = Canon(
                albums=[],
                artists=[],
            )
        return cls(canon)

    def __init__(self, canon: Canon):
        self._album_table = dict[str, str]()
        self._artist_table = dict[str, str]()
        for album in canon.albums:
            self._album_table[album.canonical.casefold()] = album.canonical
            for alternate in album.alternates:
                self._album_table[alternate.casefold()] = album.canonical
        for artist in canon.artists:
            self._artist_table[artist.canonical.casefold()] = artist.canonical
            for alternate in artist.alternates:
                self._artist_table[alternate.casefold()] = artist.canonical

    def fix_album(self, album: str | None) -> str | None:
        if album is not None:
            return self._album_table.get(album.casefold(), album)
        else:
            return None

    def fix_artist(self, artist: str | None) -> str | None:
        if artist is not None:
            return self._artist_table.get(artist.casefold(), artist)
        else:
            return None
