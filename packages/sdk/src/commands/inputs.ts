import z4 from "zod/v4"

/**
 * Sentinel value indicating there is only one input for a command kind.
 */
export const onlyOne = "__onlyOne__" as const

export const CommandInput = z4.looseObject({
    /** A string describing the kind of the input */
    kind: z4.string().readonly(),

    /** A unique identifier for the input */
    id: z4.union([z4.string(), z4.number()]).readonly(),
})
export type CommandInput = z4.infer<typeof CommandInput>

export function getCommandInputKind<TKind extends string>(
    schema: z4.ZodObject<{ kind: z4.ZodReadonly<z4.ZodLiteral<TKind>> }>,
): TKind {
    return schema.shape.kind.unwrap().value
}

export const CommandInputQuery = z4.object({
    /** The kind of input to query for */
    kind: z4.string().readonly(),
})
export type CommandInputQuery = z4.infer<typeof CommandInputQuery>
