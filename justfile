## - bootstrap

bootstrap:
    asdf plugin add python
    asdf plugin add uv
    asdf plugin add nodejs
    asdf plugin add pnpm
    asdf install
    cd ./server/ && uv sync
    cd ./web/ && pnpm install

## - dev

dev-server:
    cd ./server/ && uv run fastapi dev main.py --port 6477

dev-web:
    cd ./web/ && pnpm dev

[parallel]
dev: dev-server dev-web

## - test

test-server:
    cd ./server/ && uv run pytest

test-web:
    cd ./web/ && pnpm test

test: test-server test-web

## - lint

lint-server:
    cd ./server/ && uvx ruff check --fix

lint-web:
    cd ./web/ && pnpm biome lint --fix

lint: lint-server lint-web

## - format

format-server:
    cd ./server/ && uvx ruff format

format-web:
    cd ./web/ && pnpm biome format --fix

format: format-server format-web

## - check-types

check-types-server:
    cd ./server/ && uvx ty check

check-types-web:
    cd ./web/ && pnpm tsc --noEmit

check-types: check-types-server check-types-web
