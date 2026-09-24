"""fix_swapped_fk_names

996987fb23df created the foreign keys of several link tables with each other's
names, e.g. `fk_user_library_links_user_id_users` referenced `libraries`. This
recreates them with the names matching the columns they constrain.

Revision ID: 12ac5068c479
Revises: 32b188b8ac8d
Create Date: 2026-09-24 12:24:24.948049

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "12ac5068c479"
down_revision: Union[str, Sequence[str], None] = "32b188b8ac8d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

naming_convention = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
}

# Each link table, with its two (column, referred table) foreign keys
link_tables = {
    "artist_library_links": [("artist_id", "artists"), ("library_id", "libraries")],
    "user_library_links": [("user_id", "users"), ("library_id", "libraries")],
    "user_notification_links": [
        ("user_id", "users"),
        ("notification_id", "notifications"),
    ],
}


def _recreate_foreign_keys(swap_names: bool) -> None:
    for table_name, foreign_keys in link_tables.items():
        names = [
            f"fk_{table_name}_{column}_{referred_table}"
            for column, referred_table in foreign_keys
        ]
        if swap_names:
            names.reverse()

        with op.batch_alter_table(
            table_name, naming_convention=naming_convention, schema=None
        ) as batch_op:
            for name in names:
                batch_op.drop_constraint(name, type_="foreignkey")
            for name, (column, referred_table) in zip(names, foreign_keys):
                batch_op.create_foreign_key(
                    name,
                    referred_table,
                    [column],
                    ["id"],
                    ondelete="CASCADE",
                )


def upgrade() -> None:
    """Upgrade schema."""
    _recreate_foreign_keys(swap_names=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Restore the swapped names so the downgrade of 996987fb23df can find them
    _recreate_foreign_keys(swap_names=True)
