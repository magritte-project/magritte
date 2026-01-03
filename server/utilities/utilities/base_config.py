from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseConfig(BaseSettings):
    @classmethod
    def from_dot_env(cls):
        return cls()

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        json_schema_extra={"exclude": True},
    )
