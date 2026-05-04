interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_ENV: "dev" | "ci" | "prod"
    readonly VITE_API_URL: string
    readonly VITE_TEAM_ID: string
    readonly VITE_APP_ID: string
    readonly VITE_KEY_ID: string
    readonly VITE_KEY_SECRET: string
    readonly VITE_STOREFRONT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
