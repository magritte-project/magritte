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
            entry: resolve(__dirname, "src/index.ts"),
            formats: ["es"],
            fileName: "index",
        },
        rollupOptions: {
            external: [/^zod(\/.*)?$/, "@magritte/api", /^@magritte\/rpc(\/.*)?$/],
        },
    },
})
