import logging
import os
import pathlib
import secrets
from pathlib import Path
from typing import Literal, assert_never

from dotenv import load_dotenv, set_key
from pydantic import BaseModel, ConfigDict, Field

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


class Config(BaseModel):
    env: Literal["dev", "ci", "prod"] = Field(
        alias="ENV",
        default="dev",
        description="The environment the server is running in. Defeaults to dev",
    )

    token_algorithm: str = Field(
        alias="TOKEN_ALGORITHM",
        default="HS256",
        description="The algorithm to use when generating tokens. Defaults to HS256",
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

    data_home: str = Field(
        default=str(pathlib.Path.home().joinpath(".magritte")),
        alias="DATA_HOME",
        description="Where the instance stores its data. Defaults to $HOME/.magritte",
    )

    music_home: str = Field(
        default=str(pathlib.Path.home().joinpath("Music")),
        alias="MUSIC_HOME",
        description="Where the instance can find music files for libraries. Defaults to $HOME/Music",
    )

    custom_db: str | None = Field(
        default=None,
        alias="DB",
        description="The custom URL to connect to the database. Defaults to sqlite+aiosqlite:////$HOME/.magritte/db.sqlite3",
    )

    @property
    def db(self) -> str:
        """
        The URL to connect to the database
        """
        if self.custom_db:
            return self.custom_db
        else:
            db_file_url = pathlib.Path(self.data_home).joinpath("db.sqlite3").as_uri()
            db_url = db_file_url.replace("file://", "sqlite+aiosqlite:///")
            return db_url

    @property
    def data_home_path(self) -> pathlib.Path:
        """
        A path pointing to where data is stored and retrieved from
        """
        return pathlib.Path(config.data_home)

    @property
    def artwork_home_path(self) -> pathlib.Path:
        """
        A path pointing to where images are stored and retrieved from
        """
        return self.data_home_path.joinpath("artwork")

    @property
    def music_home_path(self) -> pathlib.Path:
        """
        A path pointing to where library files are stored and retrieved from
        """
        return pathlib.Path(config.music_home)

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

    @classmethod
    def from_dot_env(cls):
        return cls.model_validate(os.environ)

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={"exclude": True},
    )


config = Config.from_dot_env()
if not config.data_home_path.exists():
    config.data_home_path.mkdir(parents=True)
    logging.debug(f"Created data home directory at {config.data_home_path}")

if not config.artwork_home_path.exists():
    config.artwork_home_path.mkdir(parents=True)
    logging.debug(f"Created artwork home directory at {config.artwork_home_path}")
