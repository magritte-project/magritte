from functools import lru_cache

from magritte.config import config

from .client import EmailClient, EmailRecipient
from .templates import render_email_template


@lru_cache
def get_email_client() -> EmailClient | None:
    """
    Inject the default email client based on the config.
    """

    if config.email_smtp is not None:
        from magritte.email.smtp_client import SMTPEmailClient

        return SMTPEmailClient(config.email_smtp)

    if config.email_mailtrap_api_key is not None:
        from magritte.email.mailtrap_client import MailtrapEmailClient

        return MailtrapEmailClient(config.email_mailtrap_api_key)

    return None


__all__ = [
    "EmailClient",
    "EmailRecipient",
    "get_email_client",
    "render_email_template",
]
