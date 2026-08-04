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

/**
 * Returns the absolute origin of a given URL or string.
 *
 * @param subject A relative or absolute URL.
 * @param base The base URL to resolve relative URLs against.
 * @returns The absolute origin of the given URL.
 */
export function getAbsoluteOrigin(
    subject: string | URL,
    base: string | URL = globalThis.location.href,
): string {
    return new URL(subject, base).origin
}

/**
 * Returns whether a pair of URLs both refer to the same origin.
 *
 * @param a The first URL.
 * @param b The second URL.
 * @param base The base URL to resolve relative URLs against.
 * @returns `true` if the given URLs refer to the same origin; `false` otherwise.
 */
export function isSameOrigin(a: string | URL, b: string | URL, base?: string | URL): boolean {
    return getAbsoluteOrigin(a, base) === getAbsoluteOrigin(b, base)
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
    if (isSameOrigin(manifest.url, hostOrigin)) {
        throw new Error("Extension cannot have same origin as host app")
    }
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
