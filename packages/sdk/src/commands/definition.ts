import z4 from "zod/v4"

export const CommandDefinition = z4.object({
    /** Unique identifier for the command */
    id: z4.string().readonly(),

    /** The static search terms for the command */
    searchTerms: z4.string().readonly(),
})
export type CommandDefinition = z4.infer<typeof CommandDefinition>
