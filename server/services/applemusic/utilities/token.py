from datetime import datetime, timedelta

import jwt


def create_developer_token(
    expires_after: timedelta, team_id: str, key_id: str, key_secret: str, algorithm: str
):
    expires_at = datetime.now() + expires_after
    headers = {
        "alg": algorithm,
        "kid": key_id,
    }
    payload = {
        "iss": team_id,
        "exp": expires_at,
    }
    return jwt.encode(
        payload,
        key_secret,
        algorithm=algorithm,
        headers=headers,
    )
