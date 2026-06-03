import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
    input: "./openapi.json",
    output: {
        path: "./src/openapi",
        postProcess: ["oxfmt"],
    },
    plugins: [
        {
            name: "@hey-api/client-fetch",
        },
        {
            name: "@hey-api/sdk",
            responseStyle: "data",
        },
        {
            name: "zod",
            compatibilityVersion: 4,
            definitions: {
                name: (name: string) => name,
                case: "PascalCase",
                types: {
                    infer: {
                        enabled: true,
                        name: (name: string) => name,
                    },
                },
            },
            requests: false,
            responses: false,
        },
    ],
})
