import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from model.stored_values import StoredValue


@pytest.mark.asyncio
async def test_raw(db_session: AsyncSession):
    assert await StoredValue.read_raw("test_raw", db_session) is None

    await StoredValue.update_raw("test_raw", "42", db_session)

    assert await StoredValue.read_raw("test_raw", db_session) == "42"

    assert await StoredValue.remove("test_raw", db_session) is True

    assert await StoredValue.read_raw("test_raw", db_session) is None


@pytest.mark.asyncio
async def test_json(db_session: AsyncSession):
    assert await StoredValue.read("test_json", db_session) is None

    await StoredValue.update("test_json", 42, db_session)

    assert await StoredValue.read("test_json", db_session) == 42

    assert await StoredValue.remove("test_json", db_session) is True

    assert await StoredValue.read_raw("test_json", db_session) is None
