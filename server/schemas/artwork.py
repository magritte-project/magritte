from enum import Enum

from pydantic import BaseModel, Field, field_serializer


class ArtworkKind(str, Enum):
    FRONT_COVER = "front_cover"


class ArtworkRead(BaseModel):
    id: int
    kind: ArtworkKind
    image_url: str
    background_color: str | None = Field(
        description="The background color of the artwork",
    )
    primary_color: str | None = Field(
        description="The primary color of the artwork",
    )
    secondary_color: str | None = Field(
        description="The secondary color of the artwork",
    )
    tertiary_color: str | None = Field(
        description="The tertiary color of the artwork",
    )

    @field_serializer("image_url", mode="plain")
    def redact_file_image_url(self, image_url: str | None):
        """
        Redact file URLs to prevent details of the machine
        Magritte is running on from leaking.
        """
        if image_url is not None and image_url.startswith("file:"):
            return f"magritte:///artworks/{self.id}/image"
        return image_url
