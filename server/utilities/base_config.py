import os

from pydantic import BaseModel, ConfigDict


class BaseConfig(BaseModel):
    @classmethod
    def from_dot_env(cls):
        return cls.model_validate(os.environ)

    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={"exclude": True},
    )
