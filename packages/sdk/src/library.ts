import { IngestSongSchema, LibraryReadSchema } from "@magritte/api"
import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const LibraryBulkIngestableSongs = z4.object({
    libraryId: z4.number(),
    songs: z4.array(IngestSongSchema),
})
export type LibraryBulkIngestableSongsInput = z4.infer<typeof LibraryBulkIngestableSongs>

export const LibraryProtocol = protocol("Magritte.Host.Library", {
    /** Read the libraries the current user has access to */
    readLibraries: {
        input: z4.void(),
        output: z4.array(LibraryReadSchema),
    },

    /** Bulk ingest songs into a library */
    bulkIngestSongs: {
        input: LibraryBulkIngestableSongs,
        output: z4.void(),
    },

    /** Resolve an image URL for an artwork */
    resolveArtworkImageUrl: {
        input: z4.string(),
        output: z4.string().optional(),
    },
})

export type Library = ProtocolObject<typeof LibraryProtocol>
