import * as Types from "./openapi/types.gen"
import * as Schemas from "./openapi/zod.gen"

export const ExtensionManifest = Schemas.ExtensionManifest
export type ExtensionManifest = Types.ExtensionManifest
export const ExtensionPermissions = Schemas.ExtensionPermissions
export type ExtensionPermissions = Types.ExtensionPermissions
export const ExtensionUseCaseModal = Schemas.ExtensionUseCaseModal
export type ExtensionUseCaseModal = Types.ExtensionUseCaseModal
export const ExtensionUseCases = Schemas.ExtensionUseCases
export type ExtensionUseCases = Types.ExtensionUseCases
export const ExtensionUseCaseSplit = Schemas.ExtensionUseCaseSplit
export type ExtensionUseCaseSplit = Types.ExtensionUseCaseSplit

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
