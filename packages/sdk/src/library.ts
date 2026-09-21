import {
    IngestSongSchema,
    LibraryMediaReadSourceReadSchema,
    LibraryReadSchema,
    LIMIT_MAX,
} from "@magritte/api"
import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const LibraryReadExtensionSourcesSchema = z4.object({
    libraryId: z4.number().optional(),
    extensionTags: z4.array(z4.string()).optional(),
    offset: z4.number().optional(),
    limit: z4.number().max(LIMIT_MAX).optional(),
})

export const LibraryBulkIngestableSongsSchema = z4.object({
    libraryId: z4.number(),
    songs: z4.array(IngestSongSchema),
})
export type LibraryBulkIngestableSongsInput = z4.infer<typeof LibraryBulkIngestableSongsSchema>

export const LibraryProtocol = protocol("Magritte.Host.Library", {
    /** Read the libraries the current user has access to */
    readLibraries: {
        input: z4.void(),
        output: z4.array(LibraryReadSchema),
    },

    /** Read sources owned by the calling extension */
    readExtensionSources: {
        input: LibraryReadExtensionSourcesSchema,
        output: LibraryMediaReadSourceReadSchema,
    },

    /** Bulk ingest songs into a library */
    bulkIngestSongs: {
        input: LibraryBulkIngestableSongsSchema,
        output: z4.void(),
    },

    /** Resolve an image URL for an artwork */
    resolveArtworkImageUrl: {
        input: z4.string(),
        output: z4.string().optional(),
    },
})

export type Library = ProtocolObject<typeof LibraryProtocol>
