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

generate-openapi:
    ./admin dump-openapi > packages/api/openapi.json

db-create-migration slug:
    uv run alembic revision --autogenerate -m "{{slug}}"

db-migrate:
    uv run alembic upgrade head
