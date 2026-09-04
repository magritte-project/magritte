import { resolve } from "node:path"

import { defineConfig } from "vite"
import dts from "vite-plugin-dts"

export default defineConfig({
    plugins: [
        dts({
            entryRoot: "src",
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.test.ts"],
        }),
    ],
    build: {
        lib: {
            entry: {
                index: resolve(__dirname, "src/index.ts"),
                transports: resolve(__dirname, "src/transports/index.ts"),
            },
            formats: ["es"],
        },
        rollupOptions: {
            external: [/^zod(\/.*)?$/],
        },
    },
})
