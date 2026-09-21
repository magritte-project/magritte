import { TAG_MAX_LENGTH } from "@magritte/api"
import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { CommandIconSchema } from "./icons"
import { CommandInputSchema } from "./inputs"

export const SearchCommandQuerySchema = z4.object({
    /** Text query to provide results for */
    query: z4.string().max(255).readonly(),

    /** The required inputs for the command */
    inputs: z4.array(CommandInputSchema).readonly(),
})
export type SearchCommandQuery = z4.infer<typeof SearchCommandQuerySchema>

export const SearchCommandResultIDSchema = z4.string().max(TAG_MAX_LENGTH)
export type SearchCommandResultID = z4.infer<typeof SearchCommandResultIDSchema>

export const SearchCommandResultEffectSchema = z4.enum(["reveal", "play", "add"])
export type SearchCommandResultEffect = z4.infer<typeof SearchCommandResultEffectSchema>

export const SearchCommandResultSchema = z4.object({
    /** A unique identifier for the search result */
    id: SearchCommandResultIDSchema.readonly(),

    /** Optional icon for the search result */
    icon: CommandIconSchema.optional().readonly(),

    /** Title of the search result */
    title: z4.string().readonly(),

    /** Optional subtitle of the search result */
    subtitle: z4.string().optional().readonly(),

    /** Optional list of supported effects for the search result */
    supportedEffects: z4.array(SearchCommandResultEffectSchema).optional().readonly(),
})
export type SearchCommandResult = z4.infer<typeof SearchCommandResultSchema>

export const SearchCommandResultEffectRequestSchema = z4.object({
    id: SearchCommandResultIDSchema.readonly(),
    effect: SearchCommandResultEffectSchema.readonly(),
})
export type SearchCommandResultEffectRequest = z4.infer<
    typeof SearchCommandResultEffectRequestSchema
>

export const SearchCommandResponderProtocol = protocol(
    "Magritte.Extension.SearchCommandResponder",
    {
        /** Search for results matching the given query */
        search: {
            input: SearchCommandQuerySchema,
            output: z4.array(SearchCommandResultSchema),
        },
        /** Execute the given effect on a search result */
        executeEffect: {
            input: SearchCommandResultEffectRequestSchema,
            output: z4.void(),
        },
    },
)
export type SearchCommandResponder = ProtocolObject<typeof SearchCommandResponderProtocol>
