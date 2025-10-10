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

lint: lint-server

## - format

format-server:
    cd ./server/ && uvx ruff format

format: format-server
