from contextlib import asynccontextmanager
from typing import Any, Iterable

from sqlalchemy import CursorResult, Result
from sqlalchemy.exc import IllegalStateChangeError
from sqlalchemy.ext.asyncio.session import AsyncSession
from sqlmodel import SQLModel


def get_row_count(result: Result[Any]) -> int:
    """Return the row count of a result."""
    if not isinstance(result, CursorResult):
        raise ValueError("Not a CursorResult")
    return result.rowcount


@asynccontextmanager
async def suspend_db_session(
    session: AsyncSession,
    *,
    refresh_after: Iterable[SQLModel] = (),
):
    """
    Async context manager which closes a clean async database session
    for the duration of an `async with` statement, optionally
    refreshing a collection of SQL models after.

    :param session: The clean DB session to close.
    :param refresh_after: Optional SQL models to refresh
    after re-opening the DB session.
    :raises: An `IllegalStateChangeError` if the session has uncommitted changes.
    """
    if session.dirty:
        raise IllegalStateChangeError("Cannot suspend session with uncommitted changes")
    await session.close()
    yield
    for model in refresh_after:
        session.add(model)
        await session.refresh(model)
