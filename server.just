set working-directory := 'server'

bootstrap:
    uv sync
    cp .env.example .env

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

