from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field, field_serializer, field_validator

from magritte.schemas.base import TAG_MAX_LENGTH, URL_MAX_LENGTH


class ArtworkKind(str, Enum):
    FRONT_COVER = "front_cover"


class ArtworkCreate(BaseModel):
    kind: ArtworkKind
    image_url: Annotated[str, Field(max_length=URL_MAX_LENGTH)]
    background_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    primary_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    secondary_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]
    tertiary_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)]

    @field_validator("image_url", mode="before")
    @classmethod
    def reject_file_image_url(cls, image_url: str):
        if image_url.startswith("file:"):
            raise ValueError("Forbidden URL")
        return image_url


class ArtworkUpdate(BaseModel):
    kind: ArtworkKind | None = None
    image_url: Annotated[str | None, Field(max_length=URL_MAX_LENGTH)] = None
    background_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    primary_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    secondary_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None
    tertiary_color: Annotated[str | None, Field(max_length=TAG_MAX_LENGTH)] = None

    @field_validator("image_url", mode="before")
    @classmethod
    def reject_file_image_url(cls, image_url: str | None):
        if image_url is not None and image_url.startswith("file:"):
            raise ValueError("Forbidden URL")
        return image_url


class ArtworkRead(BaseModel):
    id: int
    kind: ArtworkKind
    image_url: str
    background_color: str | None
    primary_color: str | None
    secondary_color: str | None
    tertiary_color: str | None

    @field_serializer("image_url", mode="plain")
    def redact_file_image_url(self, image_url: str):
        """
        Redact file URLs to prevent details of the machine
        Magritte is running on from leaking.
        """
        if image_url.startswith("file:"):
            return f"magritte:///artworks/{self.id}/image"
        return image_url
