from datetime import timedelta
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
from sqlalchemy import ColumnExpressionArgument
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import col, select, update

from magritte.auth import (
    FeatureScope,
    create_feature_token,
    get_current_user,
    get_feature_user,
)
from magritte.db import get_db_session
from magritte.model.notification import Notification
from magritte.model.user import User, UserNotificationLink
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.base import OperationResult
from magritte.schemas.notification import (
    NotificationRead,
    NotificationsRead,
    NotificationUpdate,
)
from magritte.schemas.user import (
    UserEventPreflight,
    UserFileAccessPreflight,
    UserProfileRead,
    UserProfilesRead,
    UserProfileUpdate,
)
from magritte.utilities.db import get_row_count
from magritte.utilities.user_events import UserEvents, get_user_events

router = APIRouter(prefix="/users")


@router.get(
    "/me",
    response_model=UserProfileRead,
    summary="Read the signed in user's profile",
)
async def read_me(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
):
    return UserProfileRead(**current_user.model_dump())


@router.post(
    "/me",
    response_model=UserProfileRead,
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

    return UserProfileRead(**current_user.model_dump())


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


@router.delete(
    "/notifications/{notification_id}",
    response_model=OperationResult,
    summary="Delete a single notification for the signed in user",
)
async def delete_notification(
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
    if notification.is_locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Notification is locked"
        )

    notification_users: list[User] = await notification.awaitable_attrs.users
    if len(notification_users) > 1:
        to_remove = notification_users.index(current_user)
        del notification_users[to_remove]
    else:
        await session.delete(notification)

    return OperationResult(message="Notification deleted")


@router.post(
    "/notifications/mark-all-read",
    response_model=OperationResult,
    summary="Mark all notifications as read for the signed in user",
)
async def mark_all_notifications_read(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    result = await session.execute(
        update(Notification)
        .where(
            col(Notification.users).any(
                col(UserNotificationLink.user_id) == current_user.id
            ),
            col(Notification.is_read).is_(False),
            col(Notification.is_locked).is_(False),
        )
        .values(is_read=True)
    )
    await session.flush()
    return OperationResult(
        message="Notifications marked as read", row_count=get_row_count(result)
    )


@router.post(
    "/events/preflight",
    response_model=UserEventPreflight,
    summary="Prepare to stream events for the signed in user",
)
async def stream_user_events_preflight(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
):
    token, _ = create_feature_token(
        subject=current_user.username,
        scope=FeatureScope.USER_EVENTS_STREAM,
        expire_after=timedelta(seconds=30),
    )
    return UserEventPreflight(token=token)


@router.websocket(
    "/events",
)
async def stream_user_events(
    websocket: WebSocket,
    current_user: Annotated[
        User, Depends(get_feature_user(FeatureScope.USER_EVENTS_STREAM))
    ],
    user_events: Annotated[UserEvents, Depends(get_user_events)],
):
    user_id = current_user.id
    await user_events.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
            # TODO: Handle incoming message
    except WebSocketDisconnect:
        user_events.disconnect(user_id, websocket)


@router.get(
    "/all",
    response_model=UserProfilesRead,
    summary="Read details about users on this instance",
)
async def read_users(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[
        str | None,
        Query(
            description="Query string to filter the users by",
        ),
    ] = None,
    offset: Annotated[int, Query(description="The page offset to read from")] = 0,
    limit: Annotated[int, Query(description="How many items to read per page")] = 100,
):
    where_criteria = list[ColumnExpressionArgument]()
    if query is not None:
        where_criteria.append(User.strs_ilike(query))

    total, users = await User.read_many_with_total(
        where=[
            *where_criteria,
        ],
        joins=[],
        order_by=[col(User.last_updated).desc(), col(User.username).asc()],
        offset=offset,
        limit=limit,
        session=session,
    )
    return UserProfilesRead(
        users=[UserProfileRead(**user.model_dump()) for user in users],
        offset=offset,
        limit=limit,
        total=total,
    )


@router.get(
    "/all/{id_or_username}",
    response_model=UserProfileRead,
    summary="Read details a users on this instance",
)
async def read_user(
    id_or_username: str,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    try:
        user = await session.get(User, int(id_or_username))
    except ValueError:
        user = await session.scalar(
            select(User).where(
                col(User.username) == id_or_username,
            )
        )

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserProfileRead(**user.model_dump())


@router.post(
    "/files/preflight",
    response_model=UserFileAccessPreflight,
    summary="Prepare to read files as the current user",
)
async def read_files_preflight(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
):
    token, expires_at = create_feature_token(
        subject=current_user.username,
        scope=FeatureScope.FILES_READ,
        expire_after=timedelta(hours=1),
    )
    return UserFileAccessPreflight(token=token, expires_at=expires_at)
