import z4 from "zod/v4"

export const ExtensionManifest = z4.object({
    /** A friendly name for the extension */
    name: z4.string(),

    /** A unique identifier for the extension */
    id: z4.string(),

    /** The version of the extension */
    version: z4.string(),

    /** An optional description of the extension */
    description: z4.string().optional(),

    /** The URL of the extension */
    url: z4.string(),
})

export type ExtensionManifest = z4.infer<typeof ExtensionManifest>

/**
 * Returns the origin of the extension.
 *
 * @param manifest The manifest to determine the origin of.
 * @returns The origin of the extension.
 */
export function getExtensionOrigin(manifest: ExtensionManifest): string {
    return new URL(manifest.url).origin
}

export interface ExtensionSourceOptions {
    /**
     * The origin of the extension host.
     */
    readonly hostOrigin: string
}

export function getExtensionSrc(
    manifest: ExtensionManifest,
    { hostOrigin: parentOrigin }: ExtensionSourceOptions,
): string {
    let src = new URL(manifest.url)
    src.hash = new URLSearchParams([
        ["h", parentOrigin],
        ["e", manifest.id],
    ]).toString()
    return src.toString()
}
