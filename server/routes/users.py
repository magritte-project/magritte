from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Security,
    WebSocket,
    WebSocketDisconnect,
    status,
)
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
from schemas.user import UserProfile, UserProfileUpdate
from utilities.listeners import ListenerManager, get_listener_manager

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


@router.websocket("/listen")
async def listen(
    websocket: WebSocket,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    listener_manager: Annotated[ListenerManager, Depends(get_listener_manager)],
):
    user_id = current_user.id
    await listener_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
            # TODO: Implement logic to handle incoming messages
    except WebSocketDisconnect:
        listener_manager.disconnect(user_id, websocket)
