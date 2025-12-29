from enum import Enum

from pydantic import BaseModel


class ServiceFeature(str, Enum):
    READ_TOKEN = "read_token"
    """The service is able to vend service-specific bearer tokens"""


class ServiceRead(BaseModel):
    name: str
    display_name: str
    active: bool
    features: list[ServiceFeature]


class ServiceToken(BaseModel):
    bearer_token: str
