import { TAG_MAX_LENGTH } from "@magritte/api"
import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { CommandInputSchema } from "./inputs"
import { CommandIconSchema } from "./responder"

export const SearchCommandIDSchema = z4.string().max(TAG_MAX_LENGTH)
export type SearchCommandID = z4.infer<typeof SearchCommandIDSchema>

export const SearchCommandEffectSchema = z4.enum(["reveal", "play", "addToLibrary"])
export type SearchCommandEffect = z4.infer<typeof SearchCommandEffectSchema>

export const SearchCommandResponderItemSchema = z4.object({
    /** A unique identifier for the search result */
    id: SearchCommandIDSchema.readonly(),

    /** Optional icon for the search result */
    icon: CommandIconSchema.optional().readonly(),

    /** Title of the search result */
    title: z4.string().readonly(),

    /** Optional subtitle of the search result */
    subtitle: z4.string().optional().readonly(),

    /** Optional list of supported effects for the search result */
    supportedEffects: z4.array(SearchCommandEffectSchema).optional().readonly(),
})
export type SearchCommandResponderItem = z4.infer<typeof SearchCommandResponderItemSchema>

export const SearchCommandResponderSectionSchema = z4.object({
    /** Human readable name for this section */
    displayName: z4.string().readonly(),

    /** The items in this section */
    items: z4.array(SearchCommandResponderItemSchema).readonly(),
})
export type SearchCommandResponderSection = z4.infer<typeof SearchCommandResponderSectionSchema>

export const SearchCommandResponderSearchContextSchema = z4.object({
    /** Text query to provide results for */
    query: z4.string().max(255).readonly(),

    /** The required inputs for the command */
    inputs: z4.array(CommandInputSchema).readonly(),
})
export type SearchCommandResponderSearchContext = z4.infer<
    typeof SearchCommandResponderSearchContextSchema
>

export const SearchCommandResponderEffectContextSchema = z4.object({
    /** The ID of the item to execute the effect on */
    id: z4.string().readonly(),

    /** The required inputs for the command */
    inputs: z4.array(CommandInputSchema).readonly(),
})
export type SearchCommandResponderEffectContext = z4.infer<
    typeof SearchCommandResponderEffectContextSchema
>

export const SearchCommandResponderProtocol = protocol(
    "Magritte.Extension.SearchCommandResponder",
    {
        /** Search for items matching the given query and inputs */
        search: {
            input: SearchCommandResponderSearchContextSchema,
            output: z4.array(SearchCommandResponderSectionSchema),
        },
        executeReveal: {
            input: SearchCommandResponderEffectContextSchema,
            output: z4.void(),
        },
        executePlay: {
            input: SearchCommandResponderEffectContextSchema,
            output: z4.void(),
        },
        executeAddToLibrary: {
            input: SearchCommandResponderEffectContextSchema,
            output: z4.void(),
        },
    },
)
export type SearchCommandResponder = ProtocolObject<typeof SearchCommandResponderProtocol>
