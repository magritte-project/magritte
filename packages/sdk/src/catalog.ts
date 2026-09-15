import { IngestSongSchema } from "@magritte/api"
import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const CatalogSearchQuery = z4.object({
    /** The term to search the catalog for */
    term: z4.string().readonly(),

    /** The maximum number of results to return */
    limit: z4.number().int().positive().optional().readonly(),
})
export type CatalogSearchQuery = z4.infer<typeof CatalogSearchQuery>

export const CatalogSong = z4.object({
    /** The identifier of the song within the catalog */
    id: z4.string().readonly(),

    /** The song, in a form which can be played or ingested into a library */
    song: IngestSongSchema,
})
export type CatalogSong = z4.infer<typeof CatalogSong>

export const CatalogSearchResults = z4.object({
    songs: z4.array(CatalogSong).readonly(),
})
export type CatalogSearchResults = z4.infer<typeof CatalogSearchResults>

/**
 * A protocol which allows the host to search the catalog of a streaming music extension.
 *
 * Extensions implementing this protocol must set `catalogSearch` in their manifest.
 */
export const CatalogSearcherProtocol = protocol("Magritte.Extension.CatalogSearcher", {
    /** Search the catalog for songs matching a term */
    searchCatalog: {
        input: CatalogSearchQuery,
        output: CatalogSearchResults,
    },
})

export type CatalogSearcher = ProtocolObject<typeof CatalogSearcherProtocol>
