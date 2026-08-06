from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from magritte.auth import password_hash
from magritte.config import secrets_config
from magritte.model.library import Library
from magritte.model.user import User, UserLibraryLink
from magritte.schemas.auth import OAuth2Scope


async def _seed_users(session: AsyncSession):
    session.add(
        User(
            username="test",
            hashed_password=password_hash.hash("password", salt=secrets_config.salt),
            scope=OAuth2Scope.to_str({*OAuth2Scope}),
        )
    )
    session.add(
        User(
            username="unlucky",
            hashed_password=password_hash.hash("password", salt=secrets_config.salt),
            scope=OAuth2Scope.to_str({*OAuth2Scope}),
        )
    )
    session.add(
        User(
            username="restricted",
            hashed_password=password_hash.hash("password", salt=secrets_config.salt),
            scope=OAuth2Scope.to_str({OAuth2Scope.PROFILE, OAuth2Scope.LIBRARIES_READ}),
        )
    )
    session.add(
        User(
            username="orphaned",
            hashed_password=password_hash.hash("password", salt=secrets_config.salt),
            scope=OAuth2Scope.to_str({*OAuth2Scope}),
        )
    )
    await session.flush()


async def _seed_libraries(session: AsyncSession):
    session.add(
        Library(
            name="Empty",
            home_path=None,
        )
    )
    await session.flush()
    session.add(
        UserLibraryLink(
            user_id=1,  # test
            library_id=1,  # Empty
            can_add=False,
            can_edit=False,
            can_remove=False,
        )
    )
    await session.flush()
    session.add(
        Library(
            name="Scratch",
            home_path=None,
        )
    )
    await session.flush()
    session.add(
        UserLibraryLink(
            user_id=1,  # test
            library_id=2,  # Scratch
            can_add=True,
            can_edit=True,
            can_remove=True,
        )
    )
    session.add(
        UserLibraryLink(
            user_id=2,  # unlucky
            library_id=2,  # Scratch
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
