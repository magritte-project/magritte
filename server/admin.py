import asyncio
import sys
from argparse import ArgumentParser, Namespace
from traceback import print_tb

from db import get_db_engine, get_db_session
from ingestion.files import try_ingest_path
from model.library import Library
from model.user import User


async def ingest_main(args: Namespace):
    engine = await get_db_engine()
    async for session in get_db_session(engine):
        user = await User.read_by_username(args.username, session)
        if user is None:
            raise ValueError(f"No such user as '{args.username}'")
        library = await Library.read_by_name(
            args.library,
            user.id,
            session,
            can_add=True,
        )
        if user is None:
            raise ValueError(f"No such library as '{args.library}'")

        for path in args.paths:
            await try_ingest_path(
                path,
                args.follow_links,
                library,
                session,
            )


async def dump_openapi(args: Namespace):
    import json

    from main import app

    openapi = app.openapi()
    dump = json.dumps(openapi)
    if args.output:
        with open(args.output, "w") as output_file:
            output_file.write(dump)
    else:
        print(dump)


def admin_main():
    parser = ArgumentParser(
        prog="admin",
        description="Manage a Magritte instance",
    )
    subparsers = parser.add_subparsers(
        title="subcommands",
        description="valid subcommands",
        required=True,
    )

    parser_ingest = subparsers.add_parser(
        "ingest", help="Add existing files to a Magritte instance"
    )
    parser_ingest.add_argument("--follow-links", action="store_true", default=False)
    parser_ingest.add_argument(
        "--library",
        "-l",
        help="Name of the library to add new songs to",
        required=True,
    )
    parser_ingest.add_argument(
        "--username",
        "-u",
        help="Name of the user to add the songs under",
        required=True,
    )
    parser_ingest.add_argument("paths", nargs="*")
    parser_ingest.set_defaults(func=ingest_main)

    parser_dump_openapi = subparsers.add_parser(
        "dump-openapi", help="Export the Magritte API definition"
    )
    parser_dump_openapi.add_argument(
        "--output",
        "-o",
        help="Where to save the OpenAPI dump",
    )
    parser_dump_openapi.set_defaults(func=dump_openapi)

    args = parser.parse_args()
    try:
        asyncio.run(args.func(args))
    except Exception as e:
        if e.__traceback__:
            print_tb(e.__traceback__)
        print(f"*** Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    admin_main()
