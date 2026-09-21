import { TAG_MAX_LENGTH } from "@magritte/api"
import z4 from "zod/v4"

export const SearchResultIDSchema = z4.string().max(TAG_MAX_LENGTH)
export type SearchResultID = z4.infer<typeof SearchResultIDSchema>

export const SearchResultIconAppearanceSchema = z4.enum(["plain", "square", "circle"])
export type SearchResultIconAppearance = z4.infer<typeof SearchResultIconAppearanceSchema>

export const SearchResultIconSchema = z4.object({
    url: z4.string().readonly(),
    appearance: SearchResultIconAppearanceSchema.readonly(),
})
export type SearchResultIcon = z4.infer<typeof SearchResultIconSchema>

export const SearchResultSchema = z4.object({
    id: SearchResultIDSchema.readonly(),
    icon: SearchResultIconSchema.optional().readonly(),
    title: z4.string().readonly(),
    subtitle: z4.string().optional().readonly(),
    canReveal: z4.boolean().readonly(),
    canPlay: z4.boolean().readonly(),
    canAdd: z4.boolean().readonly(),
})
export type SearchResult = z4.infer<typeof SearchResultSchema>
