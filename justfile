mod server
mod web
mod packages
mod project
mod extensions

sync-deps:
    uv sync --all-extras
    pnpm install

[parallel]
dev: server::dev web::dev

test: server::test web::test packages::test

lint: server::lint web::lint packages::lint extensions::lint

format: server::format web::format packages::format extensions::format project::format

check-types: server::check-types web::check-types packages::check-types extensions::check-types

generate-openapi: server::generate-openapi packages::generate-openapi

clean: server::clean web::clean packages::clean

build: web::build server::build

bump-vers *ARGS: && sync-deps format
    uv run python scripts/bump-vers.py {{ARGS}}
