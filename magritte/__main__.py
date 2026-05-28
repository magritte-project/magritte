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


if __name__ == "__main__":
    parser = ArgumentParser(
        prog="magritte",
        description="Run and manage a Magritte instance",
    )
    subparsers = parser.add_subparsers(
        title="subcommands",
        description="valid subcommands",
    )

    parser_run = subparsers.add_parser("run", help="Run the Magritte server (default)")
    parser_run.set_defaults(func=run_main)

    parser_dump_openapi = subparsers.add_parser(
        "dump-openapi", help="Export the Magritte API definition"
    )
    parser_dump_openapi.add_argument(
        "--output",
        "-o",
        help="Where to save the OpenAPI dump",
    )
    parser_dump_openapi.set_defaults(func=dump_openapi_main)

    parser_new_token_secret = subparsers.add_parser(
        "new-token-secret",
        help="Make a secure random token for a .env file",
    )
    parser_new_token_secret.set_defaults(func=new_token_secret)

    parser_new_salt = subparsers.add_parser(
        "new-password-salt",
        help="Make a password salt for a .env file",
    )
    parser_new_salt.set_defaults(func=new_salt)

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
