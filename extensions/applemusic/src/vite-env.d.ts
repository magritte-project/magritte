interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_ENV: "dev" | "ci" | "prod"
    readonly VITE_STOREFRONT: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
