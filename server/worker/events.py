from dataclasses import dataclass

from utilities.user_events import UserEvent


@dataclass(frozen=True)
class SyncLibraryWorkerEvent:
    library_id: int


LibraryWorkerEvent = SyncLibraryWorkerEvent
"""An event passed from the server to the worker"""


@dataclass(frozen=True)
class NotifyUsersParentRequest:
    user_ids: set[int]
    event: UserEvent


ParentRequest = NotifyUsersParentRequest
"""
A request passed from the worker back to the parent server
"""
