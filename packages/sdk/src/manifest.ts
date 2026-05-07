import * as Types from "./openapi/types.gen"
import * as Schemas from "./openapi/zod.gen"

// TODO: Ideally this should not need to be explicit re-exported...
export const ExtensionData = Schemas.ExtensionData
export type ExtensionData = Types.ExtensionData
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

    /**
     * Optional data to pass to the extension.
     */
    readonly data?: ExtensionData
}

export function getExtensionSrc(
    manifest: ExtensionManifest,
    { hostOrigin, data }: ExtensionSourceOptions,
): string {
    let src = new URL(manifest.url)
    src.hash = new URLSearchParams([
        ["h", hostOrigin],
        ["e", manifest.id],
        ["d", JSON.stringify(data ?? {})],
    ]).toString()
    return src.toString()
}
