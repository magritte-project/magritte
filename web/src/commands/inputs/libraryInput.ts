import { CommandInput } from "@magritte/sdk"
import z4 from "zod"

export const LibraryInput = CommandInput.extend({
    kind: z4.literal("library"),
})
export type LibraryInput = z4.infer<typeof LibraryInput>

export const LibraryArtistInput = CommandInput.extend({
    kind: z4.literal("library.artist"),
})
export type LibraryArtistInput = z4.infer<typeof LibraryArtistInput>
