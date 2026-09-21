import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { SearchResultSchema } from "./result"

export const SearchQuerySchema = z4.object({ query: z4.string().max(255).readonly() })
export type SearchQuery = z4.infer<typeof SearchQuerySchema>

export const SearchResponderProtocol = protocol("Magritte.Extension.SearchResponder", {
    search: {
        input: SearchQuerySchema,
        output: z4.array(SearchResultSchema),
    },
    revealResult: {
        input: SearchResultSchema,
        output: z4.void(),
    },
    playResult: {
        input: SearchResultSchema,
        output: z4.void(),
    },
    addResult: {
        input: SearchResultSchema,
        output: z4.void(),
    },
})

export type SearchResponder = ProtocolObject<typeof SearchResponderProtocol>
