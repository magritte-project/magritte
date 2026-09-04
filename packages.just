test:
    pnpm --filter "./packages/*" run test

lint:
    pnpm --filter "./packages/*" run lint --fix

format:
    pnpm --filter "./packages/*" run format

check-types:
    pnpm --filter "./packages/*" exec tsc --noEmit

generate-openapi:
    pnpm --filter "./packages/*" run generate-openapi

clean:
    pnpm --filter "./packages/*" run clean

build:
    pnpm --filter "./packages/*" run build
