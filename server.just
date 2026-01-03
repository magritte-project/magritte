set working-directory := 'server'

sync-deps:
    uv sync

dev:
    uv run fastapi dev main.py --port 6477

test:
    uv run pytest

lint:
    uvx ruff check --fix

format:
    uvx ruff format

check-types:
    uvx ty check

clean:
    -[ -e "$PWD/dist" ] && rm -rf "$PWD/dist"

package: clean
    mkdir -p "$PWD/dist"
    cp -r "$PWD/ingestion" "$PWD/dist"
    cp -r "$PWD/model" "$PWD/dist"
    cp -r "$PWD/routes" "$PWD/dist"
    cp -r "$PWD/schemas" "$PWD/dist"
    cp -r "$PWD/services" "$PWD/dist"
    cp -r "$PWD/utilities" "$PWD/dist"
    cp "$PWD/auth.py" "$PWD/dist"
    cp "$PWD/config.py" "$PWD/dist"
    cp "$PWD/db.py" "$PWD/dist"
    cp "$PWD/main.py" "$PWD/dist"
    cp "$PWD/.python-version" "$PWD/dist"
    cp "$PWD/pyproject.toml" "$PWD/dist"
    cp "$PWD/uv.lock" "$PWD/dist"
