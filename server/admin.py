import asyncio
import secrets
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


async def dump_openapi_main(args: Namespace):
    import json

    from main import app

    openapi = app.openapi()
    dump = json.dumps(openapi)
    if args.output:
        with open(args.output, "w") as output_file:
            output_file.write(dump)
    else:
        print(dump)


async def dominant_colors_main(args: Namespace):
    from PIL import Image

    for path in args.paths:
        with Image.open(path) as image:
            if image.has_transparency_data:
                # TODO: We can handle images with an alpha channel but no transparent pixels
                raise ValueError("Transparent images not supported")

            sampleable_image = image.copy()
            sampleable_image.thumbnail((100, 100))

            paletted_image = sampleable_image.convert(
                mode="P",
                palette=Image.Palette.ADAPTIVE,
                colors=args.palette_size,
            )
            palette = paletted_image.palette
            if not palette:
                raise ValueError("Could not palletize image")

            indexed_colors = {index: color for color, index in palette.colors.items()}
            color_counts = sorted(paletted_image.getcolors(), reverse=True)
            dominant_colors = list[tuple[int, ...]]()
            for _, index in color_counts[: args.color_count]:
                dominant_colors.append(indexed_colors[index])

            for dominant_color in dominant_colors:
                match dominant_color:
                    case (red, green, blue, alpha):
                        print(f"rgba({red}, {green}, {blue}, {alpha})")
                    case (red, green, blue):
                        print(f"rgb({red}, {green}, {blue})")
                    case (white,):
                        print(f"rgb({white}, {white}, {white})")


async def new_token_secret(args: Namespace):
    print(secrets.token_hex(64))


async def new_password_salt(args: Namespace):
    print(secrets.token_hex(32))


def main():
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
    parser_dump_openapi.set_defaults(func=dump_openapi_main)

    parser_dominant_colors = subparsers.add_parser(
        "dominant-colors", help="Analyze an image for its dominant colors"
    )
    parser_dominant_colors.add_argument(
        "--palette-size",
        "-p",
        type=int,
        default=4,
        help="The size of the palette used to deduce dominant colors",
    )
    parser_dominant_colors.add_argument(
        "--color-count",
        "-c",
        type=int,
        default=4,
        help="The number of colors to produce",
    )
    parser_dominant_colors.add_argument("paths", nargs="*")
    parser_dominant_colors.set_defaults(func=dominant_colors_main)

    parser_new_token_secret = subparsers.add_parser(
        "new-token-secret",
        help="Make a secure random token for a .env file",
    )
    parser_new_token_secret.set_defaults(func=new_token_secret)

    parser_new_password_salt = subparsers.add_parser(
        "new-password-salt",
        help="Make a password salt for a .env file",
    )
    parser_new_password_salt.set_defaults(func=new_password_salt)

    args = parser.parse_args()
    try:
        asyncio.run(args.func(args))
    except Exception as e:
        if e.__traceback__:
            print_tb(e.__traceback__)
        print(f"*** Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
