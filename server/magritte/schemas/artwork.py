from enum import Enum

from pydantic import BaseModel, field_serializer, field_validator


class ArtworkKind(str, Enum):
    FRONT_COVER = "front_cover"


class ArtworkCreate(BaseModel):
    kind: ArtworkKind
    image_url: str
    background_color: str | None
    primary_color: str | None
    secondary_color: str | None
    tertiary_color: str | None

    @field_validator("image_url", mode="before")
    @classmethod
    def reject_file_image_url(cls, image_url: str):
        if image_url.startswith("file:"):
            raise ValueError("Forbidden URL")
        return image_url


class ArtworkUpdate(BaseModel):
    kind: ArtworkKind | None = None
    image_url: str | None = None
    background_color: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    tertiary_color: str | None = None

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
