interface ViteTypeOptions {
    strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_GENIUS_ACCESS_TOKEN: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
