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
    uv run datamodel-codegen --input packages/sdk/openapi.json --output magritte/schemas/sdk.py \
        --input-file-type openapi --output-model-type pydantic_v2.BaseModel \
        --use-standard-collections --skip-root-model --collapse-root-models \
        --snake-case-field --capitalize-enum-members --disable-timestamp
    just format lint

db-create-migration slug:
    uv run alembic revision --autogenerate -m "{{slug}}"

db-migrate:
    uv run alembic upgrade head
