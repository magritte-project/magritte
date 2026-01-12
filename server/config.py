import logging
import os
import secrets
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv, set_key
from pydantic import AnyUrl, Field

from utilities.base_config import BaseConfig

_dotenv_path = Path(".env").resolve()
load_dotenv(_dotenv_path)

# In dev and CI environments, we can generate secrets
# and salt if they don't already exist in .env:
if os.environ.get("ENV", "dev") != "prod":
    _must_reload = False
    for token_secret_key in ["SESSION_TOKEN_SECRET", "FILE_TOKEN_SECRET"]:
        if not os.environ.get(token_secret_key):
            logging.debug(f"Generating new {token_secret_key}")
            set_key(_dotenv_path, token_secret_key, secrets.token_hex(64))
            os.environ.pop(token_secret_key)
            _must_reload = True

    if not os.environ.get("SALT"):
        logging.debug("Generating new salt")
        set_key(_dotenv_path, "SALT", secrets.token_hex(32))
        os.environ.pop("SALT")
        _must_reload = True

    load_dotenv(_dotenv_path)


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


config = Config.from_dot_env()
