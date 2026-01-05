mod server
mod web

bootstrap:
    # Add all required asdf plugins
    asdf plugin add just
    asdf plugin add nodejs
    asdf plugin add pnpm
    asdf plugin add uv
    
    # Install project tooling
    asdf install
    
    # Set up the environment files
    -[ ! -e .env ] && cp "$PWD/.env.example" "$PWD/.env"
    -[ ! -e server/.env ] && ln -s "$PWD/.env" "$PWD/server/.env"
    -[ ! -e web/.env ] && ln -s "$PWD/.env" "$PWD/web/.env"

    # Set up server dependencies
    @just server::sync-deps
    
    # Set up web dependencies
    @just web::sync-deps

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
    -[ -e "$PWD/dist" ] && rm -rf "$PWD/dist"

package: server::package web::package
    -[ -e "$PWD/dist" ] && rm -rf "$PWD/dist"
    cp -r "$PWD/server/dist" "$PWD/dist"
    cp -r "$PWD/web/dist" "$PWD/dist/spa"
