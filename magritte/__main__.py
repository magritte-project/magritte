import asyncio
import inspect
import sys
from argparse import ArgumentParser, Namespace
from traceback import print_tb


def run_main(args: Namespace):
    import uvicorn
    from fastapi import FastAPI

    from magritte import app, app_lifespan
    from magritte.utilities.spa import SPAStaticFiles

    super_app = FastAPI(
        lifespan=app_lifespan,
        description="A Magritte instance",
    )
    super_app.mount("/api", app, name="api")
    super_app.mount(
        "/", SPAStaticFiles(directory="static", html=True), name="static-files"
    )

    uvicorn.run(super_app, host="0.0.0.0", port=8090)


def dump_openapi_main(args: Namespace):
    import json

    from magritte import app

    openapi = app.openapi()
    dump = json.dumps(openapi)
    if args.output:
        with open(args.output, "w") as output_file:
            output_file.write(dump)
    else:
        print(dump)


def new_token_secret(args: Namespace):
    import secrets

    print(secrets.token_hex(64))


def new_salt(args: Namespace):
    import secrets

    print(secrets.token_hex(32))


async def import_extension(args: Namespace):
    import pathlib

    from fastapi import HTTPException, status
    from pydantic import FileUrl

    from magritte.db import get_db_engine, get_db_session
    from magritte.model import Extension
    from magritte.schemas.extension import ExtensionManifest

    manifest_path = pathlib.Path(args.manifest_path).resolve()
    if not manifest_path.exists():
        raise FileNotFoundError("Manifest file not found")

    manifest = ExtensionManifest.model_validate_json(manifest_path.read_text())

    engine = await get_db_engine()
    async for session in get_db_session(engine):
        try:
            await Extension.import_from(
                FileUrl(manifest_path.as_uri()), manifest, session
            )
        except HTTPException as e:
            if e.status_code == status.HTTP_409_CONFLICT:
                print("Extension already imported")


async def delete_extension(args: Namespace):
    from sqlmodel import col, select

    from magritte.db import get_db_engine, get_db_session
    from magritte.model import Extension

    manifest_id = args.id

    engine = await get_db_engine()
    async for session in get_db_session(engine):
        extension = await session.scalar(
            select(Extension).where(
                col(Extension.manifest_id) == manifest_id,
            )
        )
        if not extension:
            print("No extension found")
            return

        await session.delete(extension)
        await session.flush()


if __name__ == "__main__":
    parser = ArgumentParser(
        prog="magritte",
        description="Run and manage a Magritte instance",
    )
    subparsers = parser.add_subparsers(
        title="subcommands",
        description="valid subcommands",
    )

    ## run
    parser_run = subparsers.add_parser(
        "run",
        help="Run the Magritte server (default)",
    )
    parser_run.set_defaults(func=run_main)

    ## dump-openapi
    parser_dump_openapi = subparsers.add_parser(
        "dump-openapi",
        help="Export the Magritte API definition",
    )
    parser_dump_openapi.add_argument(
        "--output",
        "-o",
        help="Where to save the OpenAPI dump",
    )
    parser_dump_openapi.set_defaults(func=dump_openapi_main)

    ## new-token-secret
    parser_new_token_secret = subparsers.add_parser(
        "new-token-secret",
        help="Make a secure random token for a .env file",
    )
    parser_new_token_secret.set_defaults(func=new_token_secret)

    ## new-password-salt
    parser_new_salt = subparsers.add_parser(
        "new-password-salt",
        help="Make a password salt for a .env file",
    )
    parser_new_salt.set_defaults(func=new_salt)

    ## import-extension
    parser_import_extension = subparsers.add_parser(
        "import-extension",
        help="Import an extension from a manifest file",
    )
    parser_import_extension.add_argument(
        "--manifest-path",
        "-m",
        help="Location of an extension manifest file",
    )
    parser_import_extension.set_defaults(func=import_extension)

    ## delete-extension
    parser_delete_extension = subparsers.add_parser(
        "delete-extension",
        help="Delete an extension",
    )
    parser_delete_extension.add_argument(
        "--id",
        "-i",
        help="The manifest ID of the extension to delete",
    )
    parser_delete_extension.set_defaults(func=delete_extension)

    parser.set_defaults(func=run_main)

    args = parser.parse_args()
    try:
        if inspect.iscoroutinefunction(args.func):
            asyncio.run(args.func(args))
        else:
            args.func(args)
    except Exception as e:
        if e.__traceback__:
            print_tb(e.__traceback__)
        print(f"*** Error: {e}", file=sys.stderr)
        sys.exit(1)
