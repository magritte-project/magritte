from datetime import datetime
from typing import Self

import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession
from sqlmodel import Field, Sequence, SQLModel, col, func, select


class LibraryModel(SQLModel, AsyncAttrs):
    """
    Base class for models in a library
    """

    id: int = Field(
        primary_key=True,
        default=None,
        description="The unique identifier of this model",
    )

    creation_date: datetime = Field(
        sa_type=sa.TIMESTAMP,
        nullable=False,
        sa_column_kwargs={
            "server_default": sa.text("CURRENT_TIMESTAMP"),
        },
        description="When this model was created",
    )

    last_updated: datetime = Field(
        sa_type=sa.TIMESTAMP,
        nullable=False,
        sa_column_kwargs={
            "server_default": sa.text("CURRENT_TIMESTAMP"),
            "server_onupdate": sa.text("CURRENT_TIMESTAMP"),
        },
        description="When this model was last updated",
    )

    @classmethod
    async def exists(
        cls,
        where: list[sa.ColumnExpressionArgument],
        joins: list[tuple[type["LibraryModel"], sa.ColumnExpressionArgument]],
        session: AsyncSession,
    ):
        """
        Check whether a model of this type matching the given criteria exists in the DB.

        :param where: The criteria to search for.
        :param joins: Any joins used in the search criteria.
        :param session: The DB to read from.
        :returns: `True` if a model exists; `False` otherwise.
        """
        what = select(cls).where(*where)
        for model, clause in joins:
            what = what.join(model, clause)
        return await session.scalar(select(True).where(what.exists())) or False

    @classmethod
    async def get_many(
        cls,
        ids: Sequence[int],
        session: AsyncSession,
    ) -> list[Self]:
        """
        Read the models with the given IDs.

        :param ids: The IDs of the models to get.
        :param session: The DB to read the models from.
        :returns: A list of matching models.
        :raises: A `ValueError` if one or more IDs is not valid.
        """
        what_models = select(cls).where(col(cls.id).in_(ids))
        model_results = await session.execute(what_models)
        models = list[Self](model_results.unique().scalars())
        if len(models) != len(ids):
            raise ValueError(f"One or more invalid {cls} IDs")
        return models

    @classmethod
    async def read_many_with_total(
        cls,
        where: list[sa.ColumnExpressionArgument],
        joins: list[tuple[type["LibraryModel"], sa.ColumnExpressionArgument]],
        order_by: list[sa.ColumnExpressionArgument],
        offset: int,
        limit: int,
        session: AsyncSession,
    ) -> tuple[int, sa.ScalarResult[Self]]:
        """
        Read a page of this model matching the given criteria.

        :param where: Criteria the models must match to be included in the page.
        :param joins: Any joins used in the criteria.
        :param order_by: How to sort the resulting models.
        :param offset: The offset to start returning models from.
        :param limit: The maximum number of models to return:
        :param session: The DB to read the models from.
        :returns: The total number of models matching the criteria
        and a page of models starting at `offset`.
        """

        total = (
            await session.scalar(
                select(func.count(col(cls.id)))
                .select_from(cls)
                .where(
                    *where,
                )
            )
            or 0
        )
        what_models = (
            select(cls).where(*where).order_by(*order_by).offset(offset).limit(limit)
        )
        for model, clause in joins:
            what_models = what_models.join(model, clause)
        model_results = await session.execute(what_models)
        models = model_results.unique().scalars()
        return total, models

    async def try_insert_unique(
        self,
        unique_by: sa.ColumnExpressionArgument,
        session: AsyncSession,
    ) -> tuple[Self, bool]:
        """
        Attempt to insert this model into the given DB, catching any
        unique constraint violations and returning an existing model.

        This method will add the model to the session and flush it.
        Call `try_insert_unique` immediately after creating a model:

        ```python
        source, inserted = await Source(
            url=source_create.url,
            mime_type=source_create.mime_type,
        ).try_insert_unique(
            col(Source.url) == source_create.url,
            session,
        )
        ```

        :param unique_by: Select criteria used to locate an existing
        model with the same data.
        :param session: The DB to insert the model into.
        :returns: Either this model or another existing model
        if a unique constraint violation was encountered, and
        a boolean indicating whether the model was inserted.
        """
        try:
            session.add(self)
            await session.flush()
            return self, True
        except IntegrityError as e:
            await session.rollback()
            existing = await session.scalar(select(type(self)).where(unique_by))
            if existing:
                return existing, False
            else:
                raise e
