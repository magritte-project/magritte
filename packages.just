test:
    pnpm --filter "./packages/*" run test

lint:
    pnpm --filter "./packages/*" run lint --fix

format:
    pnpm --filter "./packages/*" run format

check-types:
    pnpm --filter "./packages/*" --filter "!@magritte/fonts" exec tsc --noEmit

generate-openapi:
    pnpm --filter "./packages/*" run generate-openapi

clean:
    pnpm --filter "./packages/*" run clean

build:
    pnpm --filter "./packages/*" run build

publish: format lint check-types test clean build
    pnpm --filter "./packages/*" publish
