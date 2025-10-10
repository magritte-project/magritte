from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str


class UserSignUp(BaseModel):
    username: str
    password: str


class UserProfile(BaseModel):
    username: str
    preferred_name: str | None
