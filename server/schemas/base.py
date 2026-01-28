from enum import Enum

from pydantic import BaseModel


class SortOrder(str, Enum):
    ASCENDING = "+"
    DESCENDING = "-"


class OperationResult(BaseModel):
    message: str
    row_count: int | None = None
