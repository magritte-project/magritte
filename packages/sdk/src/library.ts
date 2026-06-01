import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

export const LibraryRead = z4.object({
    id: z4.number().readonly(),
    name: z4.string().readonly(),
})
export type LibraryRead = z4.infer<typeof LibraryRead>

export const LibraryIngestableArtwork = z4.object({
    kind: z4.enum(["front_cover"]).readonly(),
    image_url: z4.string().readonly(),
    background_color: z4.string().nullable().readonly(),
    primary_color: z4.string().nullable().readonly(),
    secondary_color: z4.string().nullable().readonly(),
    tertiary_color: z4.string().nullable().readonly(),
})
export type LibraryIngestableArtwork = z4.infer<typeof LibraryIngestableArtwork>

export const LibraryIngestableSource = z4.object({
    url: z4.string().readonly(),
    mime_type: z4.string().nullable().readonly(),
})
export type LibraryIngestableSource = z4.infer<typeof LibraryIngestableSource>

export const LibraryIngestableSong = z4.object({
    artist_name: z4.string().nullable().readonly(),
    album_title: z4.string().nullable().readonly(),
    artworks: z4.array(LibraryIngestableArtwork).readonly(),
    sources: z4.array(LibraryIngestableSource).readonly(),
    start_time: z4.number().readonly(),
    end_time: z4.number().readonly(),
    title: z4.string().nullable().readonly(),
    album_artist: z4.string().nullable().readonly(),
    composer: z4.string().nullable().readonly(),
    genre: z4.string().nullable().readonly(),
    release_date: z4.string().nullable().readonly(),
    track_number: z4.number().nullable().readonly(),
    track_total: z4.number().nullable().readonly(),
    disc_number: z4.number().nullable().readonly(),
    disc_total: z4.number().nullable().readonly(),
    lyrics: z4.string().nullable().readonly(),
    rating: z4.number().nullable().readonly(),
    bpm: z4.number().nullable().readonly(),
    comment: z4.string().nullable().readonly(),
    grouping: z4.string().nullable().readonly(),
    mcn: z4.string().nullable().readonly(),
    isrc: z4.string().nullable().readonly(),
    music_brainz_release_id: z4.string().nullable().readonly(),
    music_brainz_recording_id: z4.string().nullable().readonly(),
})
export type LibraryIngestableSong = z4.infer<typeof LibraryIngestableSong>

export const LibraryBulkIngestableSongs = z4.object({
    libraryId: z4.number(),
    songs: z4.array(LibraryIngestableSong).readonly(),
})
export type LibraryBulkIngestableSongsInput = z4.infer<typeof LibraryBulkIngestableSongs>

export const LibraryProtocol = protocol("Magritte.Host.Library", {
    /** Read the libraries the current user has access to */
    readLibraries: {
        input: z4.void(),
        output: z4.array(LibraryRead),
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
