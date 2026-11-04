import {
    AlbumReadSchema,
    ArtistReadSchema,
    IngestSongSchema,
    LibraryMediaReadAlbumReadSchema,
    LibraryMediaReadArtistReadSchema,
    LibraryMediaReadSongReadSchema,
    LibraryMediaReadSourceReadSchema,
    LibraryReadSchema,
    LIMIT_MAX,
    type ReadLibrarySongsSortBy,
    SongReadSchema,
} from "@magritte/api"
import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

/** The fields common to reading a page of media in a library */
const LibraryPageQuerySchema = z4.object({
    /** The library to read from */
    libraryId: z4.number(),

    /** Text to search for in the media */
    query: z4.string().optional(),

    /** The number of items to skip */
    offset: z4.number().optional(),

    /** The number of items to read */
    limit: z4.number().max(LIMIT_MAX).optional(),
})

export const LibraryArtistSelectorSchema = z4.object({
    libraryId: z4.number(),
    artistId: z4.number(),
})
export type LibraryArtistSelector = z4.infer<typeof LibraryArtistSelectorSchema>

export const LibraryArtistsQuerySchema = LibraryPageQuerySchema
export type LibraryArtistsQuery = z4.infer<typeof LibraryArtistsQuerySchema>

export const LibraryAlbumSelectorSchema = z4.object({
    libraryId: z4.number(),
    albumId: z4.number(),
})
export type LibraryAlbumSelector = z4.infer<typeof LibraryAlbumSelectorSchema>

export const LibraryAlbumsQuerySchema = LibraryPageQuerySchema.extend({
    /** Only read albums by this artist */
    artistId: z4.number().optional(),
})
export type LibraryAlbumsQuery = z4.infer<typeof LibraryAlbumsQuerySchema>

export const LibrarySongSelectorSchema = z4.object({
    libraryId: z4.number(),
    songId: z4.number(),
})
export type LibrarySongSelector = z4.infer<typeof LibrarySongSelectorSchema>

type APISongSortKey = NonNullable<ReadLibrarySongsSortBy>[number]

/**
 * Every way songs can be sorted, which must match the API exactly: each key
 * is required and nothing else is allowed, so the SDK fails to compile when
 * the API's sort keys change.
 */
const LIBRARY_SONG_SORT_KEYS = {
    "+artist_name": "+artist_name",
    "-artist_name": "-artist_name",
    "+album_title": "+album_title",
    "-album_title": "-album_title",
    "+title": "+title",
    "-title": "-title",
    "+album_artist": "+album_artist",
    "-album_artist": "-album_artist",
    "+composer": "+composer",
    "-composer": "-composer",
    "+genre": "+genre",
    "-genre": "-genre",
    "+release_date": "+release_date",
    "-release_date": "-release_date",
    "+track_number": "+track_number",
    "-track_number": "-track_number",
    "+track_total": "+track_total",
    "-track_total": "-track_total",
    "+disc_number": "+disc_number",
    "-disc_number": "-disc_number",
    "+disc_total": "+disc_total",
    "-disc_total": "-disc_total",
    "+rating": "+rating",
    "-rating": "-rating",
    "+bpm": "+bpm",
    "-bpm": "-bpm",
    "+grouping": "+grouping",
    "-grouping": "-grouping",
} as const satisfies { readonly [Key in APISongSortKey]: Key }

/** A field to sort songs by, prefixed with `+` for ascending or `-` for descending order */
export const LibrarySongSortKeySchema = z4.enum(LIBRARY_SONG_SORT_KEYS)
export type LibrarySongSortKey = z4.infer<typeof LibrarySongSortKeySchema>

export const LibrarySongsQuerySchema = LibraryPageQuerySchema.extend({
    /** Only read songs on this album */
    albumId: z4.number().optional(),

    /** Only read songs by this artist */
    artistId: z4.number().optional(),

    /** The order to read songs in, with earlier keys taking priority */
    sortBy: z4.array(LibrarySongSortKeySchema).optional(),
})
export type LibrarySongsQuery = z4.infer<typeof LibrarySongsQuerySchema>

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

    /** Read a single artist in a library */
    readArtist: {
        input: LibraryArtistSelectorSchema,
        output: ArtistReadSchema,
    },

    /** Read a page of the artists in a library matching some criteria */
    readArtists: {
        input: LibraryArtistsQuerySchema,
        output: LibraryMediaReadArtistReadSchema,
    },

    /** Read a single album in a library */
    readAlbum: {
        input: LibraryAlbumSelectorSchema,
        output: AlbumReadSchema,
    },

    /** Read a page of the albums in a library matching some criteria */
    readAlbums: {
        input: LibraryAlbumsQuerySchema,
        output: LibraryMediaReadAlbumReadSchema,
    },

    /** Read a single song in a library */
    readSong: {
        input: LibrarySongSelectorSchema,
        output: SongReadSchema,
    },

    /** Read a page of the songs in a library matching some criteria */
    readSongs: {
        input: LibrarySongsQuerySchema,
        output: LibraryMediaReadSongReadSchema,
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
