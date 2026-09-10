import logging
import os
import pathlib
import secrets
import sys
from pathlib import Path
from typing import Literal, Self, assert_never

from dotenv import load_dotenv
from pydantic import BaseModel, ConfigDict, Field

_dotenv_path = Path(".env").resolve()
load_dotenv(_dotenv_path)


class Config(BaseModel):
    env: Literal["dev", "ci", "prod"] = Field(
        alias="ENV",
        default="prod",
        description="The environment the server is running in. Defaults to prod",
    )

    token_algorithm: str = Field(
        alias="TOKEN_ALGORITHM",
        default="HS256",
        description="The algorithm to use when generating tokens. Defaults to HS256",
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

    enable_uploads: bool = Field(
        default=False,
        alias="ENABLE_UPLOADS",
        description="Whether music files can be uploaded to this instance",
    )

    upload_max_file_size: int = Field(
        default=1024 * 1024 * 1024,  # 1 GiB
        alias="UPLOAD_MAX_FILE_SIZE",
        description="The maximum size of a file that can be uploaded to this instance",
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


class SecretsConfig(BaseModel):
    """
    Encapsulates secrets configuration for the current session.
    """

    session_token_secret: str = Field(
        min_length=128,
        description="The secret used when signing user session access tokens",
    )

    feature_token_secret: str = Field(
        min_length=128,
        description="The secret used when signing feature access tokens",
    )

    salt: bytes = Field(
        min_length=64,
        description="The salt added to passwords before storing them in the DB",
    )

    @classmethod
    def _from_env(cls) -> Self | None:
        """
        Attempt to read secrets configuration from the env.

        :returns: A secrets configuration or `None` if the environment
        does not contain a full set of secrets.
        """

        session_token_secret = os.getenv("SESSION_TOKEN_SECRET")
        if not session_token_secret:
            return None

        feature_token_secret = os.getenv("FEATURE_TOKEN_SECRET")
        if not feature_token_secret:
            return None

        salt = os.getenv("SALT")
        if not salt:
            return None

        return cls(
            session_token_secret=session_token_secret,
            feature_token_secret=feature_token_secret,
            salt=salt.encode(),
        )

    @classmethod
    def _from_keyring(cls, *, create: bool = True) -> Self | None:
        """
        Attempt to read secrets configuration from the user's local
        keyring if Magritte has been installed with desktop extras.

        :param create: Whether to create random secrets if none are found.
        Defaults to `True`.
        :returns: A secrets configuration or `None` if the keyring
        is not available or secrets could not be read or created.
        """

        try:
            import keyring

            session_token_secret = keyring.get_password(
                "magritte", "session_token_secret"
            )
            if session_token_secret is None:
                if not create:
                    return None

                session_token_secret = secrets.token_hex(64)
                keyring.set_password(
                    "magritte", "session_token_secret", session_token_secret
                )
                print("Generated random session token secret", file=sys.stderr)

            feature_token_secret = keyring.get_password(
                "magritte", "feature_token_secret"
            )
            if feature_token_secret is None:
                if not create:
                    return None

                feature_token_secret = secrets.token_hex(64)
                keyring.set_password(
                    "magritte", "feature_token_secret", feature_token_secret
                )
                print("Generated random feature token secret", file=sys.stderr)

            salt = keyring.get_password("magritte", "salt")
            if salt is None:
                if not create:
                    return None

                salt = secrets.token_hex(32)
                keyring.set_password("magritte", "salt", salt)
                print("Generated random salt", file=sys.stderr)

            return cls(
                session_token_secret=session_token_secret,
                feature_token_secret=feature_token_secret,
                salt=salt.encode(),
            )
        except ImportError:
            # NOTE: keyring is a 'desktop' extra dependency
            return None

    @classmethod
    def from_best_source(cls) -> Self:
        """
        Load secrets from the best source available,
        or raise an error if none could be loaded.

        :returns: Secrets configuration for the current session.
        :raises: A `ValueError` if no secrets could be loaded.
        """

        if from_env := cls._from_env():
            return from_env

        if from_keyring := cls._from_keyring():
            return from_keyring

        raise ValueError("No secrets configured or available")


config = Config.from_dot_env()
if not config.data_home_path.exists():
    config.data_home_path.mkdir(parents=True)
    logging.debug(f"Created data home directory at {config.data_home_path}")

if not config.artwork_home_path.exists():
    config.artwork_home_path.mkdir(parents=True)
    logging.debug(f"Created artwork home directory at {config.artwork_home_path}")

secrets_config = SecretsConfig.from_best_source()
