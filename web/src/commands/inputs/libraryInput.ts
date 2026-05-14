import { CommandInput } from "@magritte/sdk/host"
import z4 from "zod"

export const LibraryInput = CommandInput.extend({
    kind: z4.literal("library"),
})
export type LibraryInput = z4.infer<typeof LibraryInput>
