interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_ENV: "dev" | "ci" | "prod"
    readonly VITE_LASTFM_API_KEY: string
    readonly VITE_LASTFM_API_SECRET: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
