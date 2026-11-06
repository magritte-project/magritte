dev:
    uv run uvicorn magritte:app --reload --port 6477

test:
    uv run pytest

lint:
    uv run ruff check --fix

format:
    uv run ruff format

check-types:
    uv run ty check

clean:
    -[ -e "$PWD/dist" ] && rm -rf "$PWD/dist"

build:
    uv build

generate-openapi:
    ./admin dump-openapi > packages/api/openapi.json
    just format

db-create-migration slug:
    uv run alembic revision --autogenerate -m "{{slug}}"

db-migrate:
    uv run alembic upgrade head
