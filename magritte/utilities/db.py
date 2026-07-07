from typing import Any

from sqlalchemy import CursorResult, Result


def get_row_count(result: Result[Any]) -> int:
    """Return the row count of a result."""
    if not isinstance(result, CursorResult):
        raise ValueError("Not a CursorResult")
    return result.rowcount
