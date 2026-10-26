import asyncio
import inspect
import sys
from argparse import ArgumentParser, Namespace
from shutil import rmtree
from traceback import print_tb


def run_main(args: Namespace):
    from pathlib import Path

    import uvicorn
    from fastapi import FastAPI

    from magritte import app, app_lifespan
    from magritte.utilities.spa import SPAStaticFiles

    static_directory = Path(__file__).parent / "static"
    if not static_directory.exists():
        raise FileNotFoundError("static assets not found, is Magritte packaged?")

    super_app = FastAPI(
        lifespan=app_lifespan,
        description="A Magritte instance",
    )
    super_app.mount("/api", app, name="api")
    super_app.mount(
        "/",
        SPAStaticFiles(directory=static_directory, html=True),
        name="static-files",
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


def generate_secrets(args: Namespace):
    import secrets

    secret_keys = [
        "SESSION_TOKEN_SECRET",
        "FEATURE_TOKEN_SECRET",
    ]
    for key in secret_keys:
        print(f"{key}={secrets.token_hex(64)}")

    salt_keys = [
        "SALT",
    ]
    for key in salt_keys:
        print(f"{key}={secrets.token_hex(32)}")


async def import_extension(args: Namespace):
    import pathlib

    from fastapi import HTTPException, status
    from pydantic import FileUrl, HttpUrl
    from sqlmodel import col, select

    from magritte.db import get_db_engine, get_db_session
    from magritte.model import Extension
    from magritte.schemas.extension import ExtensionManifest

    manifest_path = pathlib.Path(args.manifest_path).resolve()
    if not manifest_path.exists():
        raise FileNotFoundError("Manifest file not found")

    manifest = ExtensionManifest.model_validate_json(manifest_path.read_text())
    manifest.resolve_relative_urls(HttpUrl(args.dev_server_url))

    engine = await get_db_engine()
    async for session in get_db_session(engine):
        try:
            if existing := await session.scalar(
                select(Extension).where(
                    col(Extension.manifest_id) == manifest.id,
                )
            ):
                existing.update_from(manifest)
            else:
                await Extension.import_from(
                    FileUrl(manifest_path.as_uri()), manifest, session
                )
        except HTTPException as e:
            if e.status_code == status.HTTP_409_CONFLICT:
                print("*** Extension already imported", file=sys.stderr)
            else:
                raise


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
            print("*** No extension found", file=sys.stderr)
            return

        await session.delete(extension)
        await session.flush()


async def reset(args: Namespace):
    from magritte.config import config

    data_home_path = config.data_home_path
    print(f"Resetting this instance will remove all data in {data_home_path}.")
    print("Library media will not be affected nor will data stored in extensions.")

    if not args.yes:
        result = input("Are you sure you to continue? [y/N] ").strip().lower()
        if not result.startswith("y") and not result.startswith("t"):
            sys.exit(1)

    print(f"Removing all instance data from {data_home_path}")
    rmtree(data_home_path)
    print(f"Removed all instance data from {data_home_path}")


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

    ## generate-secrets
    parser_generate_secrets = subparsers.add_parser(
        "generate-secrets",
        help="Generate secrets for a .env file",
    )
    parser_generate_secrets.set_defaults(func=generate_secrets)

    ## import-extension
    parser_import_extension = subparsers.add_parser(
        "import-extension",
        help="Import an extension from a manifest file",
    )
    parser_import_extension.add_argument(
        "--manifest-path",
        "-m",
        required=True,
        help="Location of an extension manifest file",
    )
    parser_import_extension.add_argument(
        "--dev-server-url",
        "-u",
        required=True,
        help="URL of the dev server that serves the extension",
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
        required=True,
        help="The manifest ID of the extension to delete",
    )
    parser_delete_extension.set_defaults(func=delete_extension)

    ## reset
    parser_reset = subparsers.add_parser(
        "reset",
        help="Reset this instance",
    )
    parser_reset.add_argument(
        "--yes",
        "-y",
        action="store_true",
        help="Reset without confirming",
    )
    parser_reset.set_defaults(func=reset)

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
