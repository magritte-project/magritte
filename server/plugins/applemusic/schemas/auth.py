from pydantic import BaseModel


class AppleMusicPreauthorization(BaseModel):
    developer_token: str
