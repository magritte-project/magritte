dev:
    uv run fastapi dev magritte --port 6477

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

build:
    uv build
