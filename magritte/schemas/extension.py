from pydantic import BaseModel, HttpUrl

from magritte.schemas.sdk import ExtensionManifest


class ExtensionImportAdmin(BaseModel):
    manifest_url: HttpUrl


class ExtensionRead(BaseModel):
    id: int
    manifest: ExtensionManifest
