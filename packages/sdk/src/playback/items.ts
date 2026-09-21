import z4 from "zod"

export const PlayableItemArtworkSchema = z4
    .object({
        image_url: z4.string(),
        background_color: z4.string().nullable(),
        primary_color: z4.string().nullable(),
        secondary_color: z4.string().nullable(),
        tertiary_color: z4.string().nullable(),
    })
    .readonly()

export type PlayableItemArtwork = z4.infer<typeof PlayableItemArtworkSchema>

export const PlayableItemSourceSchema = z4
    .object({
        url: z4.string(),
        mime_type: z4.string().nullable(),
    })
    .readonly()

export type PlayableItemSource = z4.infer<typeof PlayableItemSourceSchema>

export const PlayableItemSchema = z4
    .object({
        id: z4.union([z4.string(), z4.number()]),
        artist_name: z4.string().nullish(),
        album_title: z4.string().nullish(),
        artworks: z4.array(PlayableItemArtworkSchema).readonly().optional(),
        sources: z4.array(PlayableItemSourceSchema).readonly().optional(),
        start_time: z4.number().optional(),
        end_time: z4.number(),
        title: z4.string().nullish(),
        genre: z4.string().nullish(),
        release_date: z4.string().nullish(),
        track_number: z4.number().nullish(),
        track_total: z4.number().nullish(),
        disc_number: z4.number().nullish(),
        disc_total: z4.number().nullish(),
        lyrics: z4.string().nullish(),
        rating: z4.number().nullish(),
    })
    .readonly()

export type PlayableItem = z4.infer<typeof PlayableItemSchema>
