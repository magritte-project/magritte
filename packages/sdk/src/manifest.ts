import z4 from "zod/v4"

export const zExtensionPermissions = z4.enum(["nowPlaying.read", "nowPlaying.events"])

export type ExtensionPermissions = z4.infer<typeof zExtensionPermissions>

export const zExtensionManifest = z4.object({
    /** A friendly name for the extension */
    name: z4.string(),

    /** A unique identifier for the extension */
    id: z4.string(),

    /** The version of the extension */
    version: z4.string(),

    /** An optional description of the extension */
    description: z4.string().optional(),

    /** The permissions required by the extension */
    permissions: z4.array(zExtensionPermissions).optional(),

    /** The URL of the extension */
    url: z4.string(),

    /** The origin of the extension */
    origin: z4.string(),
})

export type ExtensionManifest = z4.infer<typeof zExtensionManifest>
