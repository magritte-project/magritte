from fastapi import WebSocket

from schemas.listener import ListenerMessage


class Listener:
    def __init__(self, user_id: int, websocket: WebSocket):
        self.user_id = user_id
        self.websocket = websocket

    async def send_message(self, message: ListenerMessage):
        await self.websocket.send_json(message.model_dump())


class ListenerManager:
    def __init__(self):
        self._listeners = dict[int, list[Listener]]()

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self._listeners.setdefault(user_id, []).append(Listener(user_id, websocket))

    def disconnect(self, user_id: int, websocket: WebSocket):
        listeners = self._listeners.get(user_id, [])
        index = next(
            (
                index
                for index, listener in enumerate(listeners)
                if listener.websocket == websocket
            ),
            None,
        )
        if index is not None:
            del listeners[index]

    async def send_message(self, user_ids: set[int], message: ListenerMessage):
        for user_id in user_ids:
            listeners = self._listeners.get(user_id, [])
            for listener in listeners:
                await listener.send_message(message)


_listener_manager: ListenerManager | None = None


async def get_listener_manager():
    global _listener_manager
    if _listener_manager is None:
        _listener_manager = ListenerManager()
    return _listener_manager
