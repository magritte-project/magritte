import dataclasses
from dataclasses import dataclass
from enum import Enum

from fastapi import WebSocket


class UserEventType(str, Enum):
    NOTIFICATIONS_CHANGED = "notifications_changed"
    LIBRARIES_CHANGED = "libraries_changed"


@dataclass(frozen=True)
class UserEvent:
    event_type: UserEventType
    ids: list[int]


class UserEvents:
    def __init__(self):
        self._websockets_by_user = dict[int, list[WebSocket]]()

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self._websockets_by_user.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        self._websockets_by_user.get(user_id, []).remove(websocket)

    async def notify(self, user_ids: set[int], event: UserEvent):
        for user_id in user_ids:
            websockets = self._websockets_by_user.get(user_id, [])
            for websocket in websockets:
                await websocket.send_json(dataclasses.asdict(event))


_manager: UserEvents | None = None


async def get_user_events():
    global _manager
    if _manager is None:
        _manager = UserEvents()
    return _manager
