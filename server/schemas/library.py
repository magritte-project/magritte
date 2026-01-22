from pathlib import Path

from pydantic import BaseModel, field_validator


class LibraryCreate(BaseModel):
    name: str
    home_path: str | None

    @field_validator("home_path", mode="before")
    @classmethod
    def reject_file_image_url(cls, home_path: str | None):
        if home_path is not None and Path(home_path).is_absolute():
            raise ValueError("home_path must be relative")
        return home_path


class LibraryUpdate(BaseModel):
    name: str | None = None


class LibraryRead(BaseModel):
    id: int
    name: str
    home_path: str | None


class LibraryPermissionCreate(BaseModel):
    user_id: int
    can_add: bool
    can_edit: bool
    can_remove: bool


class LibraryPermissionUpdate(BaseModel):
    can_read: bool | None = None
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
