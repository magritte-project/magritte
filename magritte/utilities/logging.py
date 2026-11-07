import logging
import re

REDACTED = "[REDACTED]"

_TOKEN_QUERY_PARAM = re.compile(
    r"(?i)([?&](?:token|access_token)=)[^&#\s\"]*",
)
"""Matches the value of token query parameters, such as feature and reset tokens."""

_JWT = re.compile(
    r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*",
)
"""Matches JWTs anywhere in a string, such as in email verification paths."""


def redact_tokens(text: str) -> str:
    """
    Redact access tokens from a string, typically a URL or path being logged.

    :param text: The string to redact.
    :returns: The string with token query parameter values and JWTs replaced.
    """
    text = _TOKEN_QUERY_PARAM.sub(rf"\1{REDACTED}", text)
    return _JWT.sub(REDACTED, text)


class RedactTokensFilter(logging.Filter):
    """
    A logging filter which redacts access tokens from log record arguments,
    such as the request paths uvicorn includes in its access logs.
    """

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple):
            record.args = tuple(
                redact_tokens(arg) if isinstance(arg, str) else arg
                for arg in record.args
            )
        elif isinstance(record.args, dict):
            record.args = {
                key: redact_tokens(value) if isinstance(value, str) else value
                for key, value in record.args.items()
            }
        if isinstance(record.msg, str):
            record.msg = redact_tokens(record.msg)
        return True


_REDACTED_LOGGERS = ("uvicorn.access", "uvicorn.error")
"""Loggers which may include request paths, and the tokens within them."""


def install_token_redaction():
    """
    Redact access tokens from server logs. Safe to call more than once.
    """
    for logger_name in _REDACTED_LOGGERS:
        logger = logging.getLogger(logger_name)
        if not any(isinstance(f, RedactTokensFilter) for f in logger.filters):
            logger.addFilter(RedactTokensFilter())
