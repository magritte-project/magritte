set working-directory := 'web'

sync-deps:
    pnpm install

dev:
    pnpm dev

test:
    pnpm test

lint:
    pnpm biome lint --fix

format:
    pnpm biome format --fix

check-types:
    pnpm tsc --noEmit
