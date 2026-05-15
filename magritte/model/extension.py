from sqlmodel import JSON, Field, Relationship

from magritte.model.base import LibraryModel
from magritte.model.user import User, UserExtensionLink


class Extension(LibraryModel, table=True):
    """
    An extension imported into the instance by an admin user.
    """

    __tablename__: str = "extensions"

    manifest_id: str = Field(
        unique=True,
        index=True,
        description="The unique identifier of the extension from its manifest",
    )
    manifest_url: str = Field(
        unique=True,
        description="The canonical location of the extension's manifest",
    )
    manifest_name: str = Field(
        description="The name of the extension as specified in the manifest",
    )
    manifest: dict = Field(
        sa_type=JSON,
        default_factory=dict,
        description="The parsed manifest of the extension",
    )
    users: list[User] = Relationship(
        back_populates="installed_extensions",
        link_model=UserExtensionLink,
    )
