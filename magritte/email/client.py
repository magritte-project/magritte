from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass(frozen=True)
class EmailRecipient:
    address: str
    name: str | None = None


class EmailClient(ABC):
    """
    A client which sends email messages through some transport.
    """

    @abstractmethod
    async def send(
        self,
        *,
        sender: EmailRecipient,
        to: set[EmailRecipient],
        subject: str,
        text: str,
        html: str | None = None,
    ) -> None:
        """
        Send an email with the given contents.

        :param sender: Who the email originated from.
        :param to: The recipients of the email.
        :param subject: The subject of the email.
        :param text: The plain text body of the email.
        :param html: The optional HTML body of the email.
        :raises: Implementation defined errors if operation fails.
        Caller should be prepared to handle any exception.
        """
        raise NotImplementedError
