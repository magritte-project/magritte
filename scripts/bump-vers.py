import argparse
import json
import pathlib
import sys
import traceback

import semver
import tomlkit

parser = argparse.ArgumentParser(
    prog="bump-vers",
    description="Bump the version of all core Magritte projects",
)
parser.add_argument(
    "--major",
    action="store_true",
    help="Bump the major number",
)
parser.add_argument(
    "--minor",
    action="store_true",
    help="Bump the minor number",
)
parser.add_argument(
    "--patch",
    action="store_true",
    help="Bump the patch number",
)

try:
    args = parser.parse_args()
    if not any([args.major, args.minor, args.patch]):
        args.patch = True

    project_path = pathlib.Path(__file__).parent.parent
    pyproject_toml_path = project_path / "pyproject.toml"

    with pyproject_toml_path.open() as pyproject_toml_file:
        pyproject = tomlkit.parse(pyproject_toml_file.read())

    old_version = semver.Version.parse(pyproject["project"]["version"])

    new_version = old_version
    if args.major:
        new_version = new_version.bump_major()
    if args.minor:
        new_version = new_version.bump_minor()
    if args.patch:
        new_version = new_version.bump_patch()

    print(f"Bumping project versions from {old_version} -> {new_version}...")

    pyproject["project"]["version"] = str(new_version)
    with pyproject_toml_path.open("w") as pyproject_toml_file:
        tomlkit.dump(pyproject, pyproject_toml_file)
    print(f"* Updated {pyproject_toml_path}")

    for package_json_path in [
        project_path / "web" / "package.json",
        *project_path.glob("packages/*/package.json"),
    ]:
        with package_json_path.open("r") as package_json_file:
            package = json.load(package_json_file)

        package["version"] = str(new_version)

        with package_json_path.open("w") as package_json_file:
            json.dump(package, package_json_file, indent=4)
            package_json_file.write("\n")

        print(f"* Updated {package_json_path}")
except Exception as e:
    if e.__traceback__:
        traceback.print_tb(e.__traceback__)
    print(f"*** Error: {e}", file=sys.stderr)
    sys.exit(1)
