from datetime import timedelta

from .config import config
from .utilities.token import create_developer_token

display_name = "Apple Music"
if config.team_id and config.key_id and config.key_secret:
    features = ["read_token"]
else:
    features = []


async def read_token():
    return create_developer_token(
        expires_after=timedelta(days=7),
        team_id=config.team_id,
        key_id=config.key_id,
        key_secret=config.key_secret,
        algorithm=config.algorithm,
    )
