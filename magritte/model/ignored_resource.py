from typing import TYPE_CHECKING

from sqlmodel import Field, Relationship, SQLModel

from magritte.model.base import LibraryModel

if TYPE_CHECKING:
    from magritte.model.library import Library


class IgnoredResourceLibraryLink(SQLModel, table=True):
    __tablename__: str = "ignored_resource_library_links"

    ignored_resource_id: int | None = Field(
        default=None,
        foreign_key="ignored_resources.id",
        primary_key=True,
    )
    library_id: int | None = Field(
        default=None,
        foreign_key="libraries.id",
        primary_key=True,
    )


class IgnoredResource(LibraryModel, table=True):
    __tablename__: str = "ignored_resources"

    url: str = Field(
        description="The URL of the resource",
        unique=True,
    )

    libraries: list["Library"] = Relationship(
        back_populates="ignored_resources",
        link_model=IgnoredResourceLibraryLink,
    )
