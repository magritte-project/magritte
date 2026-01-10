from pydantic import BaseModel


class NotificationRead(BaseModel):
    id: int
    title: str
    description: str | None
    progress: float | None
    is_read: bool


class NotificationUpdate(BaseModel):
    is_read: bool | None = None


class NotificationsRead(BaseModel):
    items: list[NotificationRead]
    offset: int
    limit: int
    total: int
