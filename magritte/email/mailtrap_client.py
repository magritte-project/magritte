import asyncio
from typing import override

import mailtrap

from magritte.email.client import EmailClient, EmailRecipient


def _recipient_to_address(recipient: EmailRecipient) -> mailtrap.Address:
    """Convert an email recipient into a mailtrap address."""
    return mailtrap.Address(email=recipient.address, name=recipient.name)


class MailtrapEmailClient(EmailClient):
    """
    An email client which sends messages through the mailtrap service.
    """

    def __init__(
        self,
        token: str,
        *,
        sandbox: bool = False,
    ):
        self._client = mailtrap.MailtrapClient(
            token=token,
            sandbox=sandbox,
        )
        """
        The wrapped mailtrap client.
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
    ) -> None:
        mail = mailtrap.Mail(
            sender=_recipient_to_address(sender),
            to=[_recipient_to_address(recipient) for recipient in to],
            subject=subject,
            text=text,
            html=html,
        )
        await asyncio.to_thread(self._client.send, mail)
