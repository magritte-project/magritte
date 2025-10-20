set working-directory := 'web'

bootstrap:
    pnpm install
    cp .env.example .env

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
