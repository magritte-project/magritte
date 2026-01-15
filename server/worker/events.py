from dataclasses import dataclass


class LibraryWorkerEvent:
    """An event passed from the server to the worker"""

    pass


@dataclass(frozen=True)
class SyncLibraryWorkerEvent(LibraryWorkerEvent):
    library_id: int


class LibraryWorkerReply:
    """
    A reply to an event passed from the server to the worker

    Not all events receive replies
    """

    pass


@dataclass(frozen=True)
class SynchedLibraryWorkerReply(LibraryWorkerReply):
    library_id: int
    affected_user_ids: list[int]
