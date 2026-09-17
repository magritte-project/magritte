dev subproject:
    ./admin import-extension \
        -m "./extensions/{{subproject}}/public/extension.magritte.json" \
        -u "http://localhost:$(node -pe "require('./extensions/{{subproject}}/package.json').scripts.dev.match(/--port (\d+)/)[1]")"
    pnpm --filter "./extensions/{{subproject}}" run dev

test:
    pnpm --filter "./extensions/*" run test

lint:
    pnpm --filter "./extensions/*" run lint --fix

format:
    pnpm --filter "./extensions/*" run format

check-types:
    pnpm --filter "./extensions/*" exec tsc --noEmit
