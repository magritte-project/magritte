set working-directory := 'web'

dev:
    pnpm dev

test:
    pnpm test

lint:
    pnpm lint --fix

format:
    pnpm format

check-types:
    pnpm tsc --noEmit

clean:
    pnpm clean

build:
    pnpm build

generate-openapi:
    ../admin dump-openapi | pnpm openapi-typescript --immutable --properties-required-by-default --root-types --root-types-no-schema-prefix --output src/api/openapi.d.ts
