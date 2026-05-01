import tailwindcss from "@tailwindcss/vite"
import tanstackRouter from "@tanstack/router-plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [tanstackRouter({ autoCodeSplitting: true }), viteReact(), tailwindcss()],
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:6477",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
})
