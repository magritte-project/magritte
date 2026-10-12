from functools import lru_cache

from magritte.config import config
from magritte.email.client import EmailClient


@lru_cache
def get_default_email_client() -> EmailClient | None:
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
