from asyncio import Queue

from schemas.user import UserEvent


class UserEvents:
    def __init__(self):
        self._queues_by_user = dict[int, list[Queue[UserEvent]]]()

    def spin_up_queue(self, user_id: int):
        new_queue = Queue[UserEvent]()
        self._queues_by_user.setdefault(user_id, []).append(new_queue)
        return new_queue

    def shutdown_queue(self, user_id: int, queue: Queue[UserEvent]):
        self._queues_by_user.get(user_id, []).remove(queue)
        queue.shutdown(immediate=True)

    async def notify(self, user_ids: set[int], event: UserEvent):
        for user_id in user_ids:
            queues = self._queues_by_user.get(user_id, [])
            for queue in queues:
                queue.put_nowait(event)


_manager: UserEvents | None = None


async def get_user_event():
    global _manager
    if _manager is None:
        _manager = UserEvents()
    return _manager
