import z4 from "zod/v4"

/**
 * Sentinel value indicating there is only one input for a command kind.
 */
export const onlyOne = "__onlyOne__" as const

export const CommandInputIDSchema = z4.union([z4.string(), z4.number()])
export type CommandInputID = z4.infer<typeof CommandInputIDSchema>

export const CommandInputSchema = z4.looseObject({
    /** A string describing the kind of the input */
    kind: z4.string().readonly(),

    /** A unique identifier for the input */
    id: CommandInputIDSchema.readonly(),
})
export type CommandInput = z4.infer<typeof CommandInputSchema>

export function getCommandInputKind<TKind extends string>(
    schema: z4.ZodObject<{ kind: z4.ZodReadonly<z4.ZodLiteral<TKind>> }>,
): TKind {
    return schema.shape.kind.unwrap().value
}

export function allCommandInputsOf<
    TShape extends z4.ZodRawShape & { kind: z4.ZodReadonly<z4.ZodLiteral<string>> },
>(inputs: readonly CommandInput[], schema: z4.ZodObject<TShape>): z4.infer<z4.ZodObject<TShape>>[] {
    const kind = getCommandInputKind(schema)
    return inputs.filter((input) => input.kind === kind).map((input) => schema.parse(input))
}

export function onlyCommandInputOf<
    TShape extends z4.ZodRawShape & {
        kind: z4.ZodReadonly<z4.ZodLiteral<string>>
        id: z4.ZodReadonly<z4.ZodLiteral<typeof onlyOne>>
    },
>(inputs: readonly CommandInput[], schema: z4.ZodObject<TShape>): z4.infer<z4.ZodObject<TShape>> {
    const kind = getCommandInputKind(schema)
    const inputsOfKind = inputs.filter((input) => input.kind === kind)
    if (inputsOfKind.length !== 1) {
        throw new Error(
            `Expected exactly one input of kind ${kind}, but got ${inputsOfKind.length}`,
        )
    }
    return schema.parse(inputsOfKind[0])
}

export const CommandInputQuerySchema = z4.object({
    /** The kinds of input to query for */
    kinds: z4.array(z4.string()).readonly(),
})
export type CommandInputQuery = z4.infer<typeof CommandInputQuerySchema>
