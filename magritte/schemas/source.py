from typing import Annotated

from pydantic import BaseModel, Field, field_serializer

from magritte.schemas.base import TAG_MAX_LENGTH, URL_MAX_LENGTH, PaginatedQuery


class SourceCreate(BaseModel):
    url: Annotated[str, Field(max_length=URL_MAX_LENGTH)]
    mime_type: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    extension_manifest_id: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    extension_tag: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]


class SourceUpdate(BaseModel):
    url: Annotated[str | None, Field(max_length=URL_MAX_LENGTH)] = None
    mime_type: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    is_invalid: bool | None = None
    extension_manifest_id: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = (
        None
    )
    extension_tag: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None


class SourceLookup(BaseModel):
    urls: Annotated[
        list[Annotated[str, Field(max_length=URL_MAX_LENGTH)]],
        Field(max_length=500),
    ]


class SourceLookupRead(BaseModel):
    urls: list[str] = Field(
        description="The looked up URLs which belong to songs in the library",
    )


class SourceRead(BaseModel):
    id: int
    url: str
    mime_type: str | None
    is_invalid: bool
    extension_manifest_id: str | None
    extension_tag: str | None

    @field_serializer("url", mode="plain")
    def redact_file_urls(self, url: str):
        """
        Redact file URLs to prevent details of the machine
        Magritte is running on from leaking.
        """
        if url.startswith("file:"):
            return f"magritte:///sources/{self.id}/file"
        return url


class SourceQuery(PaginatedQuery):
    extension_manifest_id: str | None = None
    extension_tags: list[str] | None = None
