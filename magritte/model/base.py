from datetime import datetime
from typing import Any, Iterable, Self, Sequence

import sqlalchemy as sa
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncAttrs, AsyncSession
from sqlalchemy.orm import Mapped
from sqlmodel import Field, SQLModel, and_, col, func, or_, select


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
        default=None,
        sa_column_kwargs={
            "server_default": sa.text("CURRENT_TIMESTAMP"),
        },
        description="When this model was created",
    )

    last_updated: datetime = Field(
        sa_type=sa.TIMESTAMP,
        nullable=False,
        default=None,
        sa_column_kwargs={
            "server_default": sa.text("CURRENT_TIMESTAMP"),
            "server_onupdate": sa.text("CURRENT_TIMESTAMP"),
        },
        description="When this model was last updated",
    )

    @classmethod
    def query_str_fields(cls) -> list[Mapped[str] | Mapped[str | None]]:
        """
        Returns a list of string fields for this model
        for query building purposes.
        """
        raise NotImplementedError()

    @classmethod
    def strs_ilike(cls, value: str):
        """
        Returns a where clause which matches any
        string field containing the given value.

        :param value: The value to search for.
        :returns: The where clause.
        """
        escaped_value = (
            value.replace("\\", r"\\").replace("%", r"\%").replace("_", r"\_")
        )
        return or_(
            *(
                and_(
                    field.is_not(None),
                    field.ilike(f"%{escaped_value}%", escape="\\"),
                )
                for field in cls.query_str_fields()
            )
        )

    @classmethod
    async def exists(
        cls,
        where: list[sa.ColumnExpressionArgument[bool]],
        joins: list[tuple[type["SQLModel"], sa.ColumnExpressionArgument[bool]]],
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
    async def get_one_or_none(
        cls,
        id: int | None,
        session: AsyncSession,
    ):
        """
        Read the model with the given ID, if any.

        :param id: The ID of the model to get, if any.
        :param session: The DB to read the model from.
        :returns: A model if an ID was specified and it referred
        to a model which exists; `None` otherwise.
        """
        if id is None:
            return None

        return await session.get(cls, id)

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
        where: list[sa.ColumnExpressionArgument[bool]],
        joins: list[tuple[type[SQLModel], sa.ColumnExpressionArgument[bool]]],
        order_by: list[sa.ColumnExpressionArgument[Any]],
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

        what_total = (
            select(func.count(col(cls.id)))
            .select_from(cls)
            .where(
                *where,
            )
        )
        what_models = (
            select(cls).where(*where).order_by(*order_by).offset(offset).limit(limit)
        )
        for model, clause in joins:
            what_total = what_total.join(model, clause)
            what_models = what_models.join(model, clause)
        total = await session.scalar(what_total) or 0
        model_results = await session.execute(what_models)
        models = model_results.unique().scalars()
        return total, models

    async def try_insert_unique(
        self,
        unique_by: sa.ColumnExpressionArgument[bool],
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

    @classmethod
    def combine(cls, lhs: Iterable[Self], rhs: Iterable[Self]):
        """
        Merge a pair of iterables containing this model
        into a list containing only unique items.

        :param lhs: The first batch of models.
        :param rhs: The second batch of models.
        :returns: A list containing the unique models from both batches.
        """
        return [
            *(
                {model.id: model for model in lhs} | {model.id: model for model in rhs}
            ).values()
        ]
