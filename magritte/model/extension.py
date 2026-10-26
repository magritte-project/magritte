from typing import Any

from fastapi import HTTPException, status
from pydantic import AnyUrl
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import JSON, Field, Relationship, col

from magritte.model.base import LibraryModel
from magritte.model.user import User, UserExtensionLink
from magritte.schemas.extension import ExtensionManifest


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
    manifest: dict[str, Any] = Field(
        sa_type=JSON,
        default_factory=dict,
        description="The parsed manifest of the extension",
    )
    users: list[User] = Relationship(
        back_populates="installed_extensions",
        link_model=UserExtensionLink,
    )

    @classmethod
    async def import_from(
        cls,
        manifest_url: AnyUrl,
        manifest: ExtensionManifest,
        session: AsyncSession,
    ):
        if await Extension.exists(
            where=[col(Extension.manifest_id) == manifest.id],
            joins=[],
            session=session,
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Extension already imported",
            )

        new_extension = cls(
            manifest_id=manifest.id,
            manifest_url=str(manifest_url),
            manifest_name=manifest.name,
            manifest=manifest.model_dump(
                mode="json",
                by_alias=True,
            ),
        )
        session.add(new_extension)
        await session.flush()

    def update_from(self, manifest: ExtensionManifest):
        self.manifest_name = manifest.name
        self.manifest = manifest.model_dump(
            mode="json",
            by_alias=True,
        )
