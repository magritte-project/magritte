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
                name: (name: string) => `${name}Schema`,
                case: "PascalCase",
            },
            requests: false,
            responses: false,
        },
    ],
    parser: {
        patch: async (openApiDoc) => {
            // Recursively strip 'default' fields from schemas and parameters
            const removeDefaults = (obj: any) => {
                if (obj && typeof obj === "object") {
                    delete obj.default
                    for (const key in obj) {
                        removeDefaults(obj[key])
                    }
                }
            }
            removeDefaults(openApiDoc)
        },
    },
})
