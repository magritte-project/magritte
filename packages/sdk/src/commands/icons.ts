import z4 from "zod/v4"

export const CommandIconAppearanceSchema = z4.enum(["plain", "square", "circle"])
export type CommandIconAppearance = z4.infer<typeof CommandIconAppearanceSchema>

export const CommandIconSchema = z4.object({
    url: z4.string().readonly(),
    appearance: CommandIconAppearanceSchema.readonly(),
})
export type CommandIcon = z4.infer<typeof CommandIconSchema>
