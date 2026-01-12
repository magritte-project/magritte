from pydantic import Field

from utilities.base_config import BaseConfig


class Config(BaseConfig):
    apple_music_team_id: str = Field(
        alias="APPLE_MUSIC_TEAM_ID",
        default="",
        description="The team ID from Apple Connect",
    )
    apple_music_app_id: str = Field(
        alias="APPLE_MUSIC_APP_ID",
        default="",
        description="The app ID for the Apple Music key from Apple Connect",
    )
    apple_music_key_id: str = Field(
        alias="APPLE_MUSIC_KEY_ID",
        default="",
        description="The ID of the Apple Music key from Apple Connect",
    )
    apple_music_key_secret: str = Field(
        alias="APPLE_MUSIC_KEY_SECRET",
        default="",
        description="The private secret of the Apple Music key from Apple Connect",
    )
    apple_music_storefront: str = Field(
        alias="APPLE_MUSIC_STOREFRONT",
        default="us",
        description="The storefront to make Apple Music calls to",
    )


config = Config.from_dot_env()
