import logging

import pytest

from magritte.utilities.logging import (
    REDACTED,
    RedactTokensFilter,
    install_token_redaction,
    redact_tokens,
)

JWT = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl"


@pytest.mark.parametrize(
    "text,expected",
    [
        (
            f"/api/sources/1/file?token={JWT}",
            f"/api/sources/1/file?token={REDACTED}",
        ),
        (
            "/reset-password/complete?token=abc123&email=a%40b.com",
            f"/reset-password/complete?token={REDACTED}&email=a%40b.com",
        ),
        (
            f"/api/users/events?TOKEN={JWT}&x=1",
            f"/api/users/events?TOKEN={REDACTED}&x=1",
        ),
        (f"/verify/{JWT}", f"/verify/{REDACTED}"),
        ("/api/libraries/1/songs?offset=0", "/api/libraries/1/songs?offset=0"),
        ("/api/sources/1/file?tokens=keep", "/api/sources/1/file?tokens=keep"),
    ],
)
def test_redact_tokens(text: str, expected: str):
    assert redact_tokens(text) == expected


def test_filter_redacts_uvicorn_access_log_record():
    # Mirrors the arguments of uvicorn's access log records
    record = logging.LogRecord(
        name="uvicorn.access",
        level=logging.INFO,
        pathname=__file__,
        lineno=0,
        msg='%s - "%s %s HTTP/%s" %d',
        args=("127.0.0.1:1234", "GET", f"/api/sources/1/file?token={JWT}", "1.1", 200),
        exc_info=None,
    )
    assert RedactTokensFilter().filter(record)
    message = record.getMessage()
    assert JWT not in message
    assert f"?token={REDACTED}" in message
    assert message.endswith(" 200")


def test_install_is_idempotent():
    install_token_redaction()
    install_token_redaction()
    for name in ("uvicorn.access", "uvicorn.error"):
        filters = logging.getLogger(name).filters
        assert sum(isinstance(f, RedactTokensFilter) for f in filters) == 1
