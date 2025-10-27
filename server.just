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

