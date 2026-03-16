mod server
mod web

sync-deps: server::sync-deps web::sync-deps

[parallel]
dev: server::dev web::dev

test: server::test web::test

lint: server::lint web::lint

format: server::format web::format

check-types: server::check-types web::check-types

[working-directory: 'web']
export-openapi:
    ../admin dump-openapi | pnpm openapi-typescript --immutable --properties-required-by-default --root-types --root-types-no-schema-prefix -o src/api/openapi.d.ts

clean: server::clean web::clean

build: web::build server::build
