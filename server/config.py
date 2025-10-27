from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    token_algorithm: str = Field(
        default="HS256",
        description="The algorithm to use when generating tokens",
    )

    session_token_secret: str = Field(
        # min_length=128,
        description="The secret used when signing user session access tokens",
    )

    file_token_secret: str = Field(
        # min_length=128,
        description="The secret used when signing file access tokens",
    )

    salt: bytes = Field(
        # min_length=64,
        description="The salt added to passwords before storing them in the DB",
    )

    db: str = Field(
        description="The URL to connect to the database",
    )

    image_home: str = Field(
        description="Where images are stored and retrieved from",
    )

    library_home: str = Field(
        description="Where library files are stored and retrieved from",
    )

    rescan_library_on_start: bool = Field(
        description="Whether the server should rescan the library when starting up",
    )

    watch_library: bool = Field(
        description="Whether the server should watch the library for changes",
    )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        json_schema_extra={"exclude": True},
    )


config = Config()  # ty: ignore[missing-argument]
