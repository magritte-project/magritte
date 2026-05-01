dev subproject:
    pnpm --filter "./extensions/{{subproject}}" run dev

test:
    pnpm --filter "./extensions/*" run test

lint:
    pnpm --filter "./extensions/*" run lint --fix

format:
    pnpm --filter "./extensions/*" run format

check-types:
    pnpm --filter "./extensions/*" exec tsc --noEmit
