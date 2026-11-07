"""user session keys

Revision ID: 06c4c15008bb
Revises: ed80d3c863d0
Create Date: 2026-11-07 11:20:28.760428

"""

import secrets
from typing import Sequence, Union

import sqlalchemy as sa
import sqlmodel.sql.sqltypes
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "06c4c15008bb"
down_revision: Union[str, Sequence[str], None] = "ed80d3c863d0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("session_key", sqlmodel.sql.sqltypes.AutoString(), nullable=True)
        )

    # Every user needs their own random key. Tokens issued before this migration
    # don't contain a key, so they all become invalid and users must sign in again.
    users = sa.table(
        "users",
        sa.column("id", sa.Integer),
        sa.column("session_key", sa.String),
    )
    connection = op.get_bind()
    for (user_id,) in connection.execute(sa.select(users.c.id)).all():
        connection.execute(
            users.update()
            .where(users.c.id == user_id)
            .values(session_key=secrets.token_hex(32))
        )

    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.alter_column("session_key", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("users", schema=None) as batch_op:
        batch_op.drop_column("session_key")
