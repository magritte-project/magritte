from asyncio import wait_for
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    Security,
    status,
)
from fastapi_sse import sse_handler
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col

from auth import (
    get_current_user,
)
from db import get_db_session
from model.notification import Notification
from model.user import User, UserNotificationLink
from schemas.auth import OAuth2Scope
from schemas.notification import NotificationRead, NotificationsRead, NotificationUpdate
from schemas.user import UserEvent, UserProfile, UserProfileUpdate
from utilities.user_events import UserEvents, get_user_event

router = APIRouter(prefix="/users")


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Read the signed in user's profile",
)
async def read_me(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
):
    return UserProfile(**current_user.model_dump())


@router.post(
    "/me",
    response_model=UserProfile,
    summary="Update the signed in user's profile",
)
async def update_me(
    profile_update: UserProfileUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    updates = profile_update.model_dump(exclude_unset=True)
    for name, value in updates.items():
        setattr(current_user, name, value)

    await session.flush()

    return UserProfile(**current_user.model_dump())


@router.get(
    "/notifications",
    response_model=NotificationsRead,
    summary="Read a page of the signed in user's notifications",
)
async def read_notifications(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
):
    total, notifications = await Notification.read_many_with_total(
        where=[
            col(Notification.id) == col(UserNotificationLink.notification_id),
        ],
        joins=[
            (
                UserNotificationLink,
                col(UserNotificationLink.user_id) == current_user.id,
            ),
        ],
        order_by=[
            col(Notification.creation_date).desc(),
        ],
        offset=offset,
        limit=limit,
        session=session,
    )
    return NotificationsRead(
        items=[
            NotificationRead(**notification.model_dump())
            for notification in notifications
        ],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get(
    "/notifications/{notification_id}",
    response_model=NotificationRead,
    summary="Read a single notification for the signed in user",
)
async def read_notification(
    notification_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    notification = await Notification.read_one_for_user(
        notification_id, current_user.id, session
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )
    return NotificationRead(**notification.model_dump())


@router.patch(
    "/notifications/{notification_id}",
    response_model=NotificationRead,
    summary="Update a single notification for the signed in user",
)
async def update_notification(
    notification_id: int,
    update_notification: NotificationUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    notification = await Notification.read_one_for_user(
        notification_id, current_user.id, session
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found"
        )
    if notification.is_locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Notification is locked"
        )

    changes = update_notification.model_dump(
        exclude_unset=True,
    )
    for name, value in changes.items():
        setattr(notification, name, value)

    await session.flush()

    return NotificationRead(**notification.model_dump())


@router.get(
    "/events",
    response_model=UserEvent,
    summary="Stream events for the signed in user",
)
@sse_handler()
async def stream_user_events(
    request: Request,
    user_events: Annotated[UserEvents, Depends(get_user_event)],
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
):
    current_user_id = current_user.id
    event_queue = user_events.spin_up_queue(current_user_id)
    try:
        while True:
            if await request.is_disconnected():
                break

            try:
                event = await wait_for(event_queue.get(), timeout=2)
                yield event
                event_queue.task_done()
            except TimeoutError:
                pass
    finally:
        user_events.shutdown_queue(current_user_id, event_queue)
