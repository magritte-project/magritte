import { LibraryMediaReadExtensionReadSchema, LIMIT_MAX } from "@magritte/api"
import { defineBroadcast, protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const InstalledExtensionsQuerySchema = z4.object({
    offset: z4.number().optional(),
    limit: z4.number().max(LIMIT_MAX).optional(),
})
export type InstalledExtensionsQuery = z4.infer<typeof InstalledExtensionsQuerySchema>

export const InstalledExtensionsReadSchema = LibraryMediaReadExtensionReadSchema
export type InstalledExtensionsRead = z4.infer<typeof InstalledExtensionsReadSchema>

export const AvailableExtensionsQuerySchema = z4.object({
    offset: z4.number().optional(),
    limit: z4.number().max(LIMIT_MAX).optional(),
})
export type AvailableExtensionsQuery = z4.infer<typeof AvailableExtensionsQuerySchema>

export const AvailableExtensionsReadSchema = LibraryMediaReadExtensionReadSchema
export type AvailableExtensionsRead = z4.infer<typeof AvailableExtensionsReadSchema>

export const ExtensionImportSchema = z4.object({
    /** URL of an extension manifest to import */
    manifestUrl: z4.httpUrl(),
})

export const ExtensionSelectorSchema = z4.object({
    /** The local ID number of an extension on this instance */
    extensionId: z4.number(),
})
export type ExtensionSelector = z4.infer<typeof ExtensionSelectorSchema>

/** Protocol which enables an appropriately entitled extension to manage other extensions */
export const ExtensionsProtocol = protocol("Magritte.Host.Extensions", {
    /** Read a page of the current user's installed extensions */
    readInstalled: {
        input: InstalledExtensionsQuerySchema,
        output: InstalledExtensionsReadSchema,
    },
    /** Request the installation of an extension for the current user */
    requestInstall: { input: ExtensionSelectorSchema, output: z4.void() },

    /** Request an extension to be uninstalled for the current user */
    requestUninstall: { input: ExtensionSelectorSchema, output: z4.void() },

    /** Whether the current user is able to administer extensions */
    canAdminister: { input: z4.void(), output: z4.boolean() },

    /** Read a page of installable extensions on this instance */
    readInstallable: {
        input: AvailableExtensionsQuerySchema,
        output: AvailableExtensionsReadSchema,
    },

    /** Request an extension to be imported on this instance */
    requestImport: { input: ExtensionImportSchema, output: z4.void() },

    /** Request an available extension to be updated on this instance */
    requestUpdate: { input: ExtensionSelectorSchema, output: z4.void() },

    /** Request an available extension to be deleted from this instance */
    requestDelete: { input: ExtensionSelectorSchema, output: z4.void() },
})

export type Extensions = ProtocolObject<typeof ExtensionsProtocol>

/** Signals the current user's installed extensions changed */
export const InstalledExtensionsDidChange = defineBroadcast(
    ExtensionsProtocol.name,
    "installedExtensionsDidChange",
    z4.void(),
)

/** Signals the installable extensions on the instance changed */
export const InstallableExtensionsDidChange = defineBroadcast(
    ExtensionsProtocol.name,
    "installableExtensionsDidChange",
    z4.void(),
)
