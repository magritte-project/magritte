from enum import Enum
from typing import Annotated

from fastapi import HTTPException, status
from httpx2 import AsyncClient
from pydantic import BaseModel, Field, HttpUrl

from magritte.schemas.base import URL_MAX_LENGTH


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
    url: Annotated[str, Field(description="The URL of the extension")]
    icon_url: Annotated[
        str | None, Field(description="The URL of the extension's icon, if any")
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
        list[ExtensionPermissions] | None,
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
    catalog_search: Annotated[
        bool | None,
        Field(
            alias="catalogSearch",
            description="Whether the extension can search a streaming music catalog",
        ),
    ] = None

    @classmethod
    async def fetch_from(cls, client: AsyncClient, manifest_url: HttpUrl):
        response = await client.get(
            str(manifest_url),
            headers={"Accept": "application/json"},
            follow_redirects=True,
        )

        if response.status_code != status.HTTP_200_OK:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manifest could not be fetched",
            )

        return cls.model_validate_json(response.text)


class ExtensionImportAdmin(BaseModel):
    manifest_url: Annotated[HttpUrl, Field(min_length=1, max_length=URL_MAX_LENGTH)]


class ExtensionRead(BaseModel):
    id: int
    manifest: ExtensionManifest
