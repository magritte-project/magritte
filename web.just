set working-directory := 'web'

sync-deps:
    pnpm install

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

package: clean
    pnpm build
