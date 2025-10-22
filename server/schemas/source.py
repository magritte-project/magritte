from pydantic import BaseModel, field_serializer


class SourceRead(BaseModel):
    id: int
    url: str | None
    mime_type: str | None

    @field_serializer("url", mode="plain")
    def redact_file_urls(self, url: str | None):
        """
        Redact file URLs to prevent details of the machine
        Magritte is running on from leaking.
        """
        if url is not None and url.startswith("file:"):
            return f"magritte:///sources/{self.id}/file"
        return url
