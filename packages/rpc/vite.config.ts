import { createRequire } from "node:module"
import { dirname, resolve } from "node:path"

import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

// TypeScript 7 doesn't ship the lib .d.ts files API Extractor needs,
// so point it at the TypeScript version it bundles instead.
const require = createRequire(import.meta.url)
const apiExtractorTypeScript = dirname(
    createRequire(require.resolve("@microsoft/api-extractor")).resolve("typescript/package.json"),
)

export default defineConfig({
    plugins: [
        dts({
            entryRoot: "src",
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.test.ts"],
            bundleTypes: {
                invokeOptions: { typescriptCompilerFolder: apiExtractorTypeScript },
            },
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(import.meta.dirname, "src/index.ts"),
                transports: resolve(import.meta.dirname, "src/transports/index.ts"),
            },
            formats: ["es"],
        },
        rollupOptions: {
            external: [/^zod(\/.*)?$/],
        },
    },
})
