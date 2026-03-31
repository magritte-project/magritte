import z4 from "zod/v4"

export const ExtensionPermissions = z4.enum(["runInBackground"])

export type ExtensionPermissions = z4.infer<typeof ExtensionPermissions>

export const ExtensionUseCases = z4.union([
    z4.object({
        type: z4.literal("split"),

        /** The min width of the extension in a split */
        minWidth: z4.string(),

        /** The preferred location of the extension in a split */
        preferredLocation: z4.enum(["start", "end"]),
    }),

    z4.object({
        type: z4.literal("modal"),

        /** The width of the extension in a modal */
        width: z4.string(),

        /** The height of the extension in a modal */
        height: z4.string(),
    }),
])

export type ExtensionUseCases = z4.infer<typeof ExtensionUseCases>

export type ExtensionUseCase<TType extends ExtensionUseCases["type"]> = Extract<
    ExtensionUseCases,
    { type: TType }
>

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

    /** An optional array of permissions required by the extension */
    permissions: z4.array(ExtensionPermissions).default([]),

    /** Whether the extension allows multiple instances */
    allowsMultipleInstances: z4.boolean().default(false),

    /** An optional array of use cases for the extension */
    useCases: z4.array(ExtensionUseCases).default([]),
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

export const ExtensionData = z4.record(z4.string(), z4.string()).readonly()

export type ExtensionData = z4.infer<typeof ExtensionData>

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
