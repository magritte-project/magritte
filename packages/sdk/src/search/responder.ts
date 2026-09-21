import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { SearchResultIDSchema, SearchResultSchema } from "./result"

export const SearchQuerySchema = z4.object({
    query: z4.string().max(255).readonly(),
})
export type SearchQuery = z4.infer<typeof SearchQuerySchema>

export const SearchResultActionSchema = z4.enum(["reveal", "play", "add"])
export type SearchResultAction = z4.infer<typeof SearchResultActionSchema>

export const SearchResultActionRequest = z4.object({
    id: SearchResultIDSchema.readonly(),
    action: SearchResultActionSchema.readonly(),
})
export type SearchResultActionRequest = z4.infer<typeof SearchResultActionRequest>

export const SearchResponderProtocol = protocol("Magritte.Extension.SearchResponder", {
    search: {
        input: SearchQuerySchema,
        output: z4.array(SearchResultSchema),
    },
    executeResultAction: {
        input: SearchResultActionRequest,
        output: z4.void(),
    },
})

export type SearchResponder = ProtocolObject<typeof SearchResponderProtocol>
