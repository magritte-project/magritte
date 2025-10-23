from pydantic import BaseModel


class PluginRead(BaseModel):
    name: str
