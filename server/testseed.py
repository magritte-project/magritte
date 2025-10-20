from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from auth import password_hash
from model.library import Library
from model.user import User, UserLibraryLink


async def _seed_users(session: AsyncSession):
    session.add(
        User(
            username="test",
            hashed_password=password_hash.hash("password"),
        )
    )
    session.add(
        User(
            username="unlucky",
            hashed_password=password_hash.hash("password"),
        )
    )
    await session.flush()


async def _seed_libraries(session: AsyncSession):
    session.add(
        Library(
            name="Empty",
        )
    )
    await session.flush()
    session.add(
        UserLibraryLink(
            user_id=1,  # test
            library_id=1,  # Empty
            can_view=True,
            can_add=False,
            can_edit=False,
            can_remove=False,
        )
    )
    session.add(
        UserLibraryLink(
            user_id=2,  # unlucky
            library_id=1,  # Empty
            can_view=True,
            can_add=False,
            can_edit=False,
            can_remove=False,
        )
    )
    await session.flush()


async def seed_test_data(engine: AsyncEngine):
    async with AsyncSession(engine) as session:
        try:
            await _seed_users(session)
            await _seed_libraries(session)
        except:
            await session.rollback()
            raise
        else:
            await session.commit()
