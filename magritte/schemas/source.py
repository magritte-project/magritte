from typing import Annotated

from pydantic import BaseModel, Field, field_serializer

from magritte.schemas.base import TAG_MAX_LENGTH, URL_MAX_LENGTH


class SourceCreate(BaseModel):
    url: Annotated[str, Field(max_length=URL_MAX_LENGTH)]
    mime_type: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]


class SourceUpdate(BaseModel):
    url: Annotated[str | None, Field(max_length=URL_MAX_LENGTH)] = None
    mime_type: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    is_invalid: bool | None = None


class SourceRead(BaseModel):
    id: int
    url: str
    mime_type: str | None
    is_invalid: bool

    @field_serializer("url", mode="plain")
    def redact_file_urls(self, url: str):
        """
        Redact file URLs to prevent details of the machine
        Magritte is running on from leaking.
        """
        if url.startswith("file:"):
            return f"magritte:///sources/{self.id}/file"
        return url
