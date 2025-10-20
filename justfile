mod server
mod web

bootstrap:
    # Add all required asdf plugins
    asdf plugin add python
    asdf plugin add uv
    asdf plugin add nodejs
    asdf plugin add pnpm
    
    # Install project tooling
    asdf install
    
    # Set up server development environment
    @just server::bootstrap
    
    # Set up web development environment
    @just web::bootstrap

[parallel]
dev: server::dev web::dev

test: server::test web::test

lint: server::lint web::lint

format: server::format web::format

check-types: server::check-types web::check-types

[working-directory: 'web']
export-openapi:
    ../admin dump-openapi | pnpm openapi-typescript --immutable --properties-required-by-default --root-types --root-types-no-schema-prefix -o src/api/openapi.d.ts

