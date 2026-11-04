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

/** The kind of an item. A song, podcast, etc */
export const PlayableItemKindSchema = z4.enum(["song"])
export type PlayableItemKind = z4.infer<typeof PlayableItemKindSchema>

/** A section in a playable item */
export const PlayableItemSectionSchema = z4
    .object({
        /** The start time of a section in an item */
        startTime: z4.number(),

        /** The end time of a section in an item */
        endTime: z4.number(),

        /** The title of a section in an item */
        title: z4.string(),
    })
    .readonly()
export type PlayableItemSection = z4.infer<typeof PlayableItemSectionSchema>

/** The rating of an item */
export const PlayableItemRatingSchema = z4
    .number()
    .min(0, "Rating cannot be less than zero")
    .max(5, "Rating cannot be more than 5")
export type PlayableItemRating = z4.infer<typeof PlayableItemRatingSchema>

export const PlayableItemSchema = z4
    .object({
        /** The kind of the item */
        kind: PlayableItemKindSchema,

        /** The unique ID of the item */
        id: z4.string(),

        /** The title of the item */
        title: z4.string().nullish(),

        /** The creator of the item, e.g. a song's artist */
        creator: z4.string().nullish(),

        /** The collection the item belongs to, e.g. a song's album */
        collection: z4.string().nullish(),

        /** The artworks of the item, if any */
        artworks: z4.array(PlayableItemArtworkSchema).readonly().optional(),

        /** The sources of the item, if any */
        sources: z4.array(PlayableItemSourceSchema).readonly().optional(),

        /** The sections of the item, if any */
        sections: z4.array(PlayableItemSectionSchema).readonly().optional(),

        /** The start time of the item, if any */
        startTime: z4.number().optional(),

        /** The end time of the item */
        endTime: z4.number(),

        /** The rating of the item, if any */
        rating: PlayableItemRatingSchema.nullish(),

        /** The release date of the item, if any */
        releaseDate: z4.string().nullish(),
    })
    .readonly()
export type PlayableItem = z4.infer<typeof PlayableItemSchema>

/**
 * Create an identifier for a playable item.
 *
 * @param origin Where the item originates from.
 * @param kind The kind of item.
 * @param identity The unique identity of the item.
 * @returns An identifier for a playable item.
 */
export function createPlayableItemId(
    origin: string,
    kind: PlayableItemKind,
    identity: string | number,
): string {
    return `${origin}:${kind}:${identity}`
}
