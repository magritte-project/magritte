import { resolve } from "node:path"

import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import serverActions from "vite-plugin-server-actions"

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        serverActions({
            validation: {
                enabled: true,
            },
        }),
    ],
    resolve: {
        alias: {
            "@": resolve(import.meta.dirname, "./src"),
        },
    },
})
