import { resolve } from "node:path"

import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import serverActions from "vite-plugin-server-actions"
import { defineConfig } from "vitest/config"

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        serverActions({
            validation: {
                enabled: true,
            },
        }),
    ],
    test: {
        globals: true,
        environment: "jsdom",
        passWithNoTests: true,
    },
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "./src"),
        },
    },
})
