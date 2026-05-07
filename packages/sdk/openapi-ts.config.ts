import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
    input: "./openapi.json",
    output: {
        path: "./src/openapi",
        postProcess: ["oxfmt"],
    },
    plugins: [
        { name: "@hey-api/typescript", case: "PascalCase" },
        {
            name: "zod",
            compatibilityVersion: 4,
            definitions: {
                name: (name: string) => name,
                case: "PascalCase",
            },
        },
    ],
})
