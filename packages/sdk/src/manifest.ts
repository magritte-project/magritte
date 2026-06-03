import type { ExtensionManifest } from "@magritte/api"

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
    { hostOrigin }: ExtensionSourceOptions,
): string {
    let src = new URL(manifest.url)
    src.hash = new URLSearchParams([
        ["h", hostOrigin],
        ["e", manifest.id],
    ]).toString()
    return src.toString()
}

export function getExtensionAllow(manifest: ExtensionManifest): string {
    const allows: string[] = []
    if (manifest.sourceSchemes && manifest.sourceSchemes.length > 0) {
        allows.push("encrypted-media *")
        allows.push("autoplay")
    }
    return allows.join("; ")
}
