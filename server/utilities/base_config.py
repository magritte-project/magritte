import logging
import os
import secrets
from pathlib import Path

from dotenv import load_dotenv, set_key
from pydantic import BaseModel, ConfigDict

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


class BaseConfig(BaseModel):
    @classmethod
    def from_dot_env(cls):
        return cls.model_validate(os.environ)

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={"exclude": True},
    )
