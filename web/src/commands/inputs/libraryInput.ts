import z4 from "zod"

import { CommandInput } from "@/commands/inputs/base"

export const LibraryInput = CommandInput.extend({
    kind: z4.literal("library"),
})
export type LibraryInput = z4.infer<typeof LibraryInput>
