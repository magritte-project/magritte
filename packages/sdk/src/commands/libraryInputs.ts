import z4 from "zod"

import { CommandInputSchema } from "./inputs"

export const LibraryInputSchema = CommandInputSchema.extend({
    kind: z4.literal("library").readonly(),
    id: z4.number().readonly(),
})
export type LibraryInput = z4.infer<typeof LibraryInputSchema>

export const LibraryArtistInputSchema = CommandInputSchema.extend({
    kind: z4.literal("library.artist").readonly(),
    id: z4.number().readonly(),
})
export type LibraryArtistInput = z4.infer<typeof LibraryArtistInputSchema>

export const LibraryAlbumInputSchema = CommandInputSchema.extend({
    kind: z4.literal("library.album").readonly(),
    id: z4.number().readonly(),
})
export type LibraryAlbumInput = z4.infer<typeof LibraryAlbumInputSchema>

export const LibrarySongInputSchema = CommandInputSchema.extend({
    kind: z4.literal("library.song").readonly(),
    id: z4.number().readonly(),
})
export type LibrarySongInput = z4.infer<typeof LibrarySongInputSchema>
