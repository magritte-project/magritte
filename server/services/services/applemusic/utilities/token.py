from datetime import datetime, timedelta

import jwt


def create_developer_token(
    expires_after: timedelta,
    team_id: str,
    app_id: str,
    key_id: str,
    key_secret: str,
    algorithm: str,
):
    expires_at = datetime.now() + expires_after
    headers = {
        "alg": algorithm,
        "kid": key_id,
    }
    payload = {
        "iss": team_id,
        "iat": datetime.now(),
        "exp": expires_at,
        "sub": app_id,
    }
    return jwt.encode(
        payload,
        key_secret,
        algorithm=algorithm,
        headers=headers,
    )
