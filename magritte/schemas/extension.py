import asyncio
from enum import Enum
from typing import Annotated
from urllib.parse import urljoin

from fastapi import HTTPException, status
from httpx2 import AsyncClient, TimeoutException
from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from magritte.schemas.base import URL_MAX_LENGTH

_MANIFEST_MAX_BYTES: int = 1024 * 500
"""The maximum size an extension manifest is permitted to be."""

_MANIFEST_FETCH_TIMEOUT_SECONDS: float = 10
"""How long to wait before aborting a fetch manifest."""


class ExtensionPermissions(Enum):
    RUN_BACKGROUND = "run:background"
    RUN_EAGER = "run:eager"
    COMMANDS_INPUT_READ = "commands:input:read"
    COMMANDS_INPUT_ADD = "commands:input:add"
    COMMANDS_QUERY = "commands:query"
    COMMANDS_RUN = "commands:run"
    LIBRARIES_READ = "libraries:read"
    LIBRARIES_WRITE = "libraries:write"
    PLAYBACK_READ = "playback:read"
    PLAYBACK_CONTROL = "playback:control"


class ExtensionCommand(BaseModel):
    id: Annotated[str, Field(description="Unique identifier for the command")]
    search_terms: Annotated[
        str,
        Field(
            alias="searchTerms", description="The static search terms for the command"
        ),
    ]
    required_input_kinds: Annotated[
        list[str],
        Field(
            alias="requiredInputKinds",
            description="The kinds of the inputs this command requires to execute",
        ),
    ]
    highlight_availability: Annotated[
        bool,
        Field(
            alias="highlightAvailability",
            description="Whether the command should be highlighted when it becomes available",
        ),
    ] = False

    model_config = ConfigDict(extra="allow")


class ExtensionSearchCommand(BaseModel):
    required_input_kinds: Annotated[
        list[str],
        Field(
            alias="requiredInputKinds",
            description="The kinds of the inputs the search command requires to execute",
        ),
    ]

    model_config = ConfigDict(extra="allow")


class ExtensionManifest(BaseModel):
    name: Annotated[
        str,
        Field(description="A friendly name for the extension", max_length=255),
    ]
    id: Annotated[
        str,
        Field(
            description="A unique identifier for the extension",
            max_length=255,
        ),
    ]
    version: Annotated[
        str,
        Field(description="The version of the extension", max_length=100),
    ]
    description: Annotated[
        str | None,
        Field(
            description="An optional description of the extension",
            max_length=1000,
        ),
    ] = None
    url: Annotated[str, Field(description="The possibly relative URL of the extension")]
    icon_url: Annotated[
        str | None,
        Field(description="The possibly relative URL of the extension's icon, if any"),
    ] = None
    preferred_width: Annotated[
        str | None,
        Field(
            alias="preferredWidth",
            description="The preferred width of the extension as a CSS dimension",
        ),
    ] = None
    preferred_height: Annotated[
        str | None,
        Field(
            alias="preferredHeight",
            description="The preferred height of the extension as a CSS dimension",
        ),
    ] = None
    permissions: Annotated[
        list[ExtensionPermissions | str] | None,
        Field(description="An optional array of permissions required by the extension"),
    ] = None
    source_schemes: Annotated[
        list[str] | None,
        Field(
            alias="sourceSchemes",
            description="An optional array of source schemes supported by the extension",
        ),
    ] = None
    commands: Annotated[
        list[ExtensionCommand] | None,
        Field(
            description="An optional array of commands supported by the extension",
        ),
    ] = None
    search_command: Annotated[
        ExtensionSearchCommand | None,
        Field(
            alias="searchCommand",
            description="An optional search command supported by the extension",
        ),
    ] = None

    model_config = ConfigDict(extra="allow")

    def resolve_relative_urls(self, manifest_url: HttpUrl):
        """Resolve any relative URLs in the manifest against the manifest URL"""
        self.url = urljoin(str(manifest_url), self.url)
        if self.icon_url:
            self.icon_url = urljoin(str(manifest_url), self.icon_url)

    @classmethod
    async def fetch_from(cls, client: AsyncClient, manifest_url: HttpUrl):
        try:
            async with (
                asyncio.timeout(_MANIFEST_FETCH_TIMEOUT_SECONDS),
                client.stream(
                    "GET",
                    str(manifest_url),
                    headers={"Accept": "application/json"},
                    follow_redirects=True,
                ) as response,
            ):
                if response.status_code != status.HTTP_200_OK:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Manifest could not be fetched",
                    )

                content_length = response.headers.get("Content-Length", "")
                if (
                    content_length.isdigit()
                    and int(content_length) > _MANIFEST_MAX_BYTES
                ):
                    raise HTTPException(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        detail="Manifest exceeds size limit",
                    )

                body = bytearray()
                async for chunk in response.aiter_bytes():
                    body.extend(chunk)
                    if len(body) > _MANIFEST_MAX_BYTES:
                        raise HTTPException(
                            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                            detail="Manifest exceeds size limit",
                        )
        except (TimeoutError, TimeoutException) as e:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Manifest fetch timed out",
            ) from e

        response_text = body.decode(response.encoding or "utf-8")
        manifest = cls.model_validate_json(response_text)
        manifest.resolve_relative_urls(manifest_url)
        return manifest


class ExtensionImportAdmin(BaseModel):
    manifest_url: Annotated[HttpUrl, Field(min_length=1, max_length=URL_MAX_LENGTH)]


class ExtensionRead(BaseModel):
    id: int
    manifest: ExtensionManifest
