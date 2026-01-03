from pydantic import Field

from utilities.base_config import BaseConfig


class Config(BaseConfig):
    algorithm: str = Field(
        default="ES256",
        description="The algorithm to use when generating tokens",
    )

    apple_music_team_id: str = Field(
        default="",
        description="The team ID from Apple Connect",
    )
    apple_music_app_id: str = Field(
        default="",
        description="The app ID for the Apple Music key from Apple Connect",
    )
    apple_music_key_id: str = Field(
        default="",
        description="The ID of the Apple Music key from Apple Connect",
    )
    apple_music_key_secret: str = Field(
        default="",
        description="The private secret of the Apple Music key from Apple Connect",
    )
    apple_music_storefront: str = Field(
        default="us",
        description="The storefront to make Apple Music calls to",
    )


config = Config.from_dot_env()
