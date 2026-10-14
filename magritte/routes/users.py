from datetime import timedelta
from typing import Annotated

from fastapi import (
    APIRouter,
    BackgroundTasks,
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
    send_verification_email,
)
from magritte.db import get_db_session
from magritte.email import EmailClient, get_email_client
from magritte.model.library import Library
from magritte.model.notification import Notification
from magritte.model.user import User, UserNotificationLink
from magritte.schemas.auth import OAuth2Scope
from magritte.schemas.base import OperationResult, PaginatedQuery
from magritte.schemas.notification import (
    NotificationRead,
    NotificationsRead,
    NotificationUpdate,
)
from magritte.schemas.user import (
    UserAdminRead,
    UserAdminsRead,
    UserAdminUpdate,
    UserEventPreflight,
    UserFileAccessPreflight,
    UserProfileMeRead,
    UserProfileMeUpdate,
    UserProfileRead,
    UserProfilesQuery,
    UserProfilesRead,
)
from magritte.utilities.db import get_row_count
from magritte.utilities.user_events import UserEvents, get_user_events

router = APIRouter(prefix="/users")


@router.get(
    "/me",
    response_model=UserProfileMeRead,
    summary="Read the signed in user's profile",
)
async def read_me(
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
):
    return UserProfileMeRead(**current_user.model_dump())


@router.post(
    "/me",
    response_model=UserProfileMeRead,
    summary="Update the signed in user's profile",
)
async def update_me(
    profile_update: UserProfileMeUpdate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.PROFILE])
    ],
    email_client: Annotated[EmailClient | None, Depends(get_email_client)],
    session: Annotated[AsyncSession, Depends(get_db_session, scope="function")],
):
    updates = profile_update.model_dump(
        exclude={"email"},
        exclude_unset=True,
    )
    for name, value in updates.items():
        setattr(current_user, name, value)

    if (
        "email" in profile_update.model_fields_set
        and profile_update.email != current_user.email
    ):
        if profile_update.email is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot clear email",
            )

        email_already_used = await User.exists(
            where=[
                col(User.email) == str(profile_update.email),
            ],
            joins=[],
            session=session,
        )
        if email_already_used:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already in use"
            )

        current_user.email = str(profile_update.email)
        current_user.is_email_verified = False

        if email_client is not None:
            background_tasks.add_task(
                send_verification_email,
                email_client,
                user_email=current_user.email,
                user_username=current_user.username,
            )

    await session.flush()

    return UserProfileMeRead(**current_user.model_dump())


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
    query: Annotated[PaginatedQuery, Query()],
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
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return NotificationsRead(
        items=[
            NotificationRead(**notification.model_dump())
            for notification in notifications
        ],
        total=total,
        offset=query.offset,
        limit=query.limit,
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
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.PROFILE])],
    summary="Read details about users on this instance",
)
async def read_users(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[UserProfilesQuery, Query()],
):
    where_criteria = list[ColumnExpressionArgument]()
    if query.query is not None:
        where_criteria.append(User.strs_ilike(query.query))

    total, users = await User.read_many_with_total(
        where=[
            *where_criteria,
        ],
        joins=[],
        order_by=[col(User.last_updated).desc(), col(User.username).asc()],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return UserProfilesRead(
        users=[UserProfileRead(**user.model_dump()) for user in users],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )


@router.get(
    "/all/{id_or_username}",
    response_model=UserProfileRead,
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.PROFILE])],
    summary="Read details a users on this instance",
)
async def read_user(
    id_or_username: str,
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserProfileRead(**user.model_dump())


@router.get(
    "/admin/all",
    response_model=UserAdminsRead,
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.ADMIN])],
    summary="Read details about users on this instance, including their scopes",
)
async def read_users_admin(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    query: Annotated[UserProfilesQuery, Query()],
):
    where_criteria = list[ColumnExpressionArgument]()
    if query.query is not None:
        where_criteria.append(User.strs_ilike(query.query))

    total, users = await User.read_many_with_total(
        where=[
            *where_criteria,
        ],
        joins=[],
        order_by=[col(User.last_updated).desc(), col(User.username).asc()],
        offset=query.offset,
        limit=query.limit,
        session=session,
    )
    return UserAdminsRead(
        users=[
            UserAdminRead(**user.model_dump(), scopes=sorted(user.scopes))
            for user in users
        ],
        offset=query.offset,
        limit=query.limit,
        total=total,
    )


@router.get(
    "/admin/all/{id_or_username}",
    response_model=UserAdminRead,
    dependencies=[Security(get_current_user, scopes=[OAuth2Scope.ADMIN])],
    summary="Read details a users on this instance, including their scopes",
)
async def read_user_admin(
    id_or_username: str,
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserAdminRead(**user.model_dump(), scopes=sorted(user.scopes))


@router.patch(
    "/admin/all/{user_id}",
    response_model=UserAdminRead,
    summary="Update a user on this instance, including their granted scopes",
)
async def update_user_admin(
    user_id: int,
    user_update: UserAdminUpdate,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.ADMIN])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    if (
        user.id == current_user.id
        and user_update.scopes is not None
        and OAuth2Scope.ADMIN not in user_update.scopes
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove admin scope from the signed in user",
        )

    updates = user_update.model_dump(exclude_unset=True)
    for name, value in updates.items():
        setattr(user, name, value)

    await session.flush()

    return UserAdminRead(**user.model_dump(), scopes=sorted(user.scopes))


@router.delete(
    "/admin/all/{user_id}",
    response_model=OperationResult,
    summary="Delete a user on this instance, along with any libraries only they belong to",
)
async def delete_user_admin(
    user_id: int,
    current_user: Annotated[
        User, Security(get_current_user, scopes=[OAuth2Scope.ADMIN])
    ],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete the signed in user",
        )

    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    libraries: list[Library] = await user.awaitable_attrs.libraries
    for library in libraries:
        library_users: list[User] = await library.awaitable_attrs.users
        if all(library_user.id == user_id for library_user in library_users):
            await session.delete(library)

    await session.delete(user)
    await session.flush()

    return OperationResult(message="User deleted", row_count=1)


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
