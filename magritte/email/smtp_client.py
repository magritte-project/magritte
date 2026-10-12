import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from enum import Enum
from typing import assert_never, override
from urllib.parse import urlparse

from .client import (
    EMAIL_CLIENT_DEFAULT_TIMEOUT,
    EmailClient,
    EmailRecipient,
)


def _format_recipient(recipient: EmailRecipient) -> str:
    """Format an email recipient as an SMTP address."""

    if recipient.name is None:
        return recipient.address
    return formataddr((recipient.name, recipient.address))


class _SMTPSecurity(str, Enum):
    """
    Encapsulates the different security modes of an `SMTPEmailClient`.
    """

    TLS = "tls"
    START_TLS = "start_tls"
    NONE = "none"

    @staticmethod
    def from_url_scheme(scheme):
        """
        Returns the SMTP security value for the given URL scheme.
        """
        match scheme:
            case "smtp":
                return _SMTPSecurity.NONE
            case "smtp+tls":
                return _SMTPSecurity.TLS
            case "smtp+starttls":
                return _SMTPSecurity.START_TLS
            case _:
                raise ValueError("invalid scheme")


class SMTPEmailClient(EmailClient):
    """
    An email client which sends messages through an SMTP server.
    """

    def __init__(
        self,
        url: str,
    ):
        """
        Initialize an SMTP email client object.

        :param url: A URL specifying the SMTP server to use
        as well as the credentials.
        """
        parsed_url = urlparse(url)
        if not parsed_url.hostname:
            raise ValueError("missing hostname")
        self.host: str = parsed_url.hostname
        """
        The SMTP server's hostname.
        """
        self.port: int = parsed_url.port or 587
        """
        The port the SMTP server is listening on.
        """
        self.username: str | None = parsed_url.username
        """
        The username to authenticate with, if any.
        """
        self.password: str | None = parsed_url.password
        """
        The password to authenticate with, if any.
        """
        self.security: _SMTPSecurity = _SMTPSecurity.from_url_scheme(parsed_url.scheme)
        """
        The security policy of the SMTP server.
        """

    @override
    async def send(
        self,
        *,
        sender: EmailRecipient,
        to: set[EmailRecipient],
        subject: str,
        text: str,
        html: str | None = None,
        timeout: int = EMAIL_CLIENT_DEFAULT_TIMEOUT,
    ) -> None:
        message = EmailMessage()
        message["From"] = _format_recipient(sender)
        message["To"] = ", ".join(_format_recipient(r) for r in to)
        message["Subject"] = subject
        message["Message-ID"] = make_msgid(domain=sender.address.rpartition("@")[2])
        message.set_content(text)
        if html is not None:
            message.add_alternative(html, subtype="html")

        await asyncio.to_thread(self._send_message, message, timeout)

    def _send_message(self, message: EmailMessage, timeout: int) -> None:
        context = ssl.create_default_context()
        match self.security:
            case _SMTPSecurity.TLS:
                smtp = smtplib.SMTP_SSL(
                    self.host, self.port, timeout=timeout, context=context
                )
            case _SMTPSecurity.START_TLS | _SMTPSecurity.NONE:
                smtp = smtplib.SMTP(self.host, self.port, timeout=timeout)
            case _:
                assert_never(self.security)

        with smtp:
            if self.security == _SMTPSecurity.START_TLS:
                smtp.starttls(context=context)
            if self.username is not None and self.password is not None:
                smtp.login(self.username, self.password)
            smtp.send_message(message)
