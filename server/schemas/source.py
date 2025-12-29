from pydantic import BaseModel, field_serializer


class SourceCreate(BaseModel):
    url: str
    mime_type: str | None


class SourceUpdate(BaseModel):
    url: str | None = None
    mime_type: str | None = None
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
