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
    ../admin dump-openapi > ../packages/api/openapi.json
