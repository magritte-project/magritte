from pathlib import Path
from typing import Annotated

from pydantic import BaseModel, Field, field_validator

from magritte.schemas.artwork import ArtworkRead
from magritte.schemas.base import PATH_MAX_LENGTH, TAG_MAX_LENGTH


class LibraryCreate(BaseModel):
    name: Annotated[str, Field(max_length=TAG_MAX_LENGTH)]
    home_path: Annotated[str | None, Field(max_length=PATH_MAX_LENGTH)]
    uploads_enabled: bool
    cover_artwork: ArtworkRead | None

    @field_validator("home_path", mode="before")
    @classmethod
    def reject_file_image_url(cls, home_path: str | None):
        if home_path is not None and Path(home_path).is_absolute():
            raise ValueError("home_path must be relative")
        return home_path


class LibraryUpdate(BaseModel):
    name: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    uploads_enabled: bool | None = None
    cover_artwork: ArtworkRead | None = None


class LibraryRead(BaseModel):
    id: int
    name: str
    home_path: str | None
    uploads_enabled: bool
    cover_artwork: ArtworkRead | None


class LibraryPermissionCreate(BaseModel):
    user_id: int
    can_add: bool
    can_edit: bool
    can_remove: bool


class LibraryPermissionUpdate(BaseModel):
    can_add: bool | None = None
    can_edit: bool | None = None
    can_remove: bool | None = None


class LibraryPermissionRead(BaseModel):
    user_id: int
    username: str
    can_add: bool
    can_edit: bool
    can_remove: bool


class LibraryMediaRead[Item: BaseModel](BaseModel):
    items: list[Item]
    offset: int
    limit: int
    total: int


class LibraryHomePathRead(BaseModel):
    relative_to: str
    subpaths: list[str]


class LibraryIgnoredResourceRead(BaseModel):
    id: int
    url: str
