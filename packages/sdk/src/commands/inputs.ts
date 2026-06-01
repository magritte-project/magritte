import z4 from "zod/v4"

export type CommandInputArg =
    | string
    | number
    | boolean
    | null
    | readonly CommandInputArg[]
    | { readonly [x in string]?: CommandInputArg }
export const CommandInputArg: z4.ZodType<CommandInputArg> = z4.lazy(() =>
    z4.union([
        z4.string(),
        z4.number(),
        z4.boolean(),
        z4.null(),
        z4.array(CommandInputArg).readonly(),
        z4.record(z4.string(), CommandInputArg.optional()).readonly(),
    ]),
)

export const CommandInput = z4.object({
    /** A string describing the kind of the input */
    kind: z4.string().readonly(),

    /** A unique identifier for the input */
    id: z4.union([z4.string(), z4.number()]).readonly(),

    /** The arguments for the input */
    args: z4.record(z4.string(), CommandInputArg).optional().readonly(),
})
export type CommandInput = z4.infer<typeof CommandInput>

export const singletonInputID = "__onlyOne__" as const
export const SingletonCommandInput = CommandInput.extend({
    id: z4.literal(singletonInputID).readonly(),
})
export type SingletonCommandInput = z4.infer<typeof SingletonCommandInput>

export const CommandInputQuery = z4.object({
    /** The kind of input to query for */
    kind: z4.string().readonly(),
})
export type CommandInputQuery = z4.infer<typeof CommandInputQuery>
