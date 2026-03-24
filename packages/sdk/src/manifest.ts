import z4 from "zod/v4"

export const extensionManifestSchema = z4.object({
    name: z4.string(),
    id: z4.string(),
    version: z4.string(),
    description: z4.string().optional(),
})

export type ExtensionManifest = z4.infer<typeof extensionManifestSchema>
