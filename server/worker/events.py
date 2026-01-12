from dataclasses import dataclass


class LibraryEvent:
    pass


@dataclass(frozen=True)
class SyncLibraryEvent(LibraryEvent):
    library_id: int
