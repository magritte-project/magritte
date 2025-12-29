import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Config(BaseSettings):
    algorithm: str = Field(
        default="ES256",
        description="The algorithm to use when generating tokens",
    )

    team_id: str = Field(
        default="",
        description="The team ID from Apple Connect",
    )
    key_id: str = Field(
        default="",
        description="The ID of the Apple Music key from Apple Connect",
    )
    key_secret: str = Field(
        default="",
        description="The private secret of the Apple Music key from Apple Connect",
    )
    storefront: str = Field(
        default="us",
        description="The storefront to make Apple Music calls to",
    )

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"),
        env_file_encoding="utf-8",
    )


config = Config()  # ty: ignore[missing-argument]
