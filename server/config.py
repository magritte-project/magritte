import logging
import pathlib
from typing import Literal, assert_never

from pydantic import AnyUrl, Field

from utilities.base_config import BaseConfig


class Config(BaseConfig):
    env: Literal["dev", "ci", "prod"] = Field(
        alias="ENV",
        default="dev",
        description="The environment the server is running in",
    )

    token_algorithm: str = Field(
        alias="TOKEN_ALGORITHM",
        default="HS256",
        description="The algorithm to use when generating tokens",
    )

    session_token_secret: str = Field(
        alias="SESSION_TOKEN_SECRET",
        min_length=128,
        description="The secret used when signing user session access tokens",
    )

    file_token_secret: str = Field(
        alias="FILE_TOKEN_SECRET",
        min_length=128,
        description="The secret used when signing file access tokens",
    )

    salt: bytes = Field(
        alias="SALT",
        min_length=64,
        description="The salt added to passwords before storing them in the DB",
    )

    db: str = Field(
        alias="DB",
        description="The URL to connect to the database",
    )

    image_home: str = Field(
        alias="IMAGE_HOME",
        description="Where images are stored and retrieved from",
    )

    library_home: AnyUrl = Field(
        alias="LIBRARY_HOME",
        description="A URL specifying where library files are stored and retrieved from",
    )

    watch_library: bool = Field(
        alias="WATCH_LIBRARY",
        description="Whether the server should watch the library for changes",
    )

    @property
    def image_home_path(self) -> pathlib.Path:
        """
        A path pointing to where images are stored and retrieved from
        """
        return pathlib.Path(config.image_home)

    @property
    def library_home_path(self) -> pathlib.Path:
        """
        A path pointing to where library files are stored and retrieved from
        """
        return pathlib.Path.from_uri(str(config.library_home))

    @property
    def logging_level(self):
        """
        The logging level to use for the current environment
        """
        match self.env:
            case "dev" | "ci":
                return logging.DEBUG
            case "prod":
                return logging.INFO
            case _:
                assert_never(self.env)


config = Config.from_dot_env()
