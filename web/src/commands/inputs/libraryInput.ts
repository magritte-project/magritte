import { CommandInput } from "@magritte/sdk"
import z4 from "zod"

export const LibraryInput = CommandInput.extend({
    kind: z4.literal("library").readonly(),
    id: z4.number().readonly(),
})
export type LibraryInput = z4.infer<typeof LibraryInput>

export const LibraryArtistInput = CommandInput.extend({
    kind: z4.literal("library.artist").readonly(),
    id: z4.number().readonly(),
})
export type LibraryArtistInput = z4.infer<typeof LibraryArtistInput>

export const LibraryAlbumInput = CommandInput.extend({
    kind: z4.literal("library.album").readonly(),
    id: z4.number().readonly(),
})
export type LibraryAlbumInput = z4.infer<typeof LibraryAlbumInput>

export const LibrarySongInput = CommandInput.extend({
    kind: z4.literal("library.song").readonly(),
    id: z4.number().readonly(),
})
export type LibrarySongInput = z4.infer<typeof LibrarySongInput>
