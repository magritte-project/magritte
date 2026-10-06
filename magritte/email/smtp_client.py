import asyncio
import smtplib
import ssl
from email.message import EmailMessage
from email.utils import formataddr, make_msgid
from typing import Literal, assert_never, override

from magritte.email.client import EmailClient, EmailRecipient


def _format_recipient(recipient: EmailRecipient) -> str:
    """Format an email recipient as an SMTP address."""

    if recipient.name is None:
        return recipient.address
    return formataddr((recipient.name, recipient.address))


class SMTPEmailClient(EmailClient):
    """
    An email client which sends messages through an SMTP server.
    """

    def __init__(
        self,
        *,
        host: str,
        port: int,
        username: str | None = None,
        password: str | None = None,
        security: Literal["tls", "starttls", "none"] = "starttls",
        timeout: float = 30.0,
    ) -> None:
        self.host = host
        self.port = port
        self.username = username
        self.password = password
        self.security = security
        self.timeout = timeout

    @override
    async def send(
        self,
        *,
        sender: EmailRecipient,
        to: set[EmailRecipient],
        subject: str,
        text: str,
        html: str | None = None,
    ) -> None:
        message = EmailMessage()
        message["From"] = _format_recipient(sender)
        message["To"] = ", ".join(_format_recipient(r) for r in to)
        message["Subject"] = subject
        message["Message-ID"] = make_msgid(domain=sender.address.rpartition("@")[2])
        message.set_content(text)
        if html is not None:
            message.add_alternative(html, subtype="html")

        await asyncio.to_thread(self._send_message, message)

    def _send_message(self, message: EmailMessage) -> None:
        context = ssl.create_default_context()
        match self.security:
            case "tls":
                smtp = smtplib.SMTP_SSL(
                    self.host, self.port, timeout=self.timeout, context=context
                )
            case "starttls" | "none":
                smtp = smtplib.SMTP(self.host, self.port, timeout=self.timeout)
            case _:
                assert_never(self.security)

        with smtp:
            if self.security == "starttls":
                smtp.starttls(context=context)
            if self.username is not None and self.password is not None:
                smtp.login(self.username, self.password)
            smtp.send_message(message)
