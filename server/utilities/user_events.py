from fastapi import WebSocket

from schemas.user import UserEvent


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
                await websocket.send_json(event.model_dump())


_manager: UserEvents | None = None


async def get_user_events():
    global _manager
    if _manager is None:
        _manager = UserEvents()
    return _manager
