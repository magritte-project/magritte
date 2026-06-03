from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


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
    id: str = Field(..., description="Unique identifier for the command")
    search_terms: str = Field(
        ..., alias="searchTerms", description="The static search terms for the command"
    )
    required_input_kinds: list[str] = Field(
        ...,
        alias="requiredInputKinds",
        description="The kinds of the inputs this command requires to execute",
    )


class ExtensionManifest(BaseModel):
    name: str = Field(..., description="A friendly name for the extension")
    id: str = Field(..., description="A unique identifier for the extension")
    version: str = Field(..., description="The version of the extension")
    description: str | None = Field(
        None, description="An optional description of the extension"
    )
    url: str = Field(..., description="The URL of the extension")
    preferred_width: str | None = Field(
        None,
        alias="preferredWidth",
        description="The preferred width of the extension as a CSS dimension",
    )
    preferred_height: str | None = Field(
        None,
        alias="preferredHeight",
        description="The preferred height of the extension as a CSS dimension",
    )
    permissions: list[ExtensionPermissions] | None = Field(
        [], description="An optional array of permissions required by the extension"
    )
    source_schemes: list[str] | None = Field(
        [],
        alias="sourceSchemes",
        description="An optional array of source schemes supported by the extension",
    )
    commands: list[ExtensionCommand] | None = Field(
        default_factory=list,
        description="An optional array of commands supported by the extension",
    )


class ExtensionImportAdmin(BaseModel):
    manifest_url: HttpUrl


class ExtensionRead(BaseModel):
    id: int
    manifest: ExtensionManifest
