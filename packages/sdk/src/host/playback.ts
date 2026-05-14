import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod"

export const PlayableItemArtwork = z4
    .object({
        image_url: z4.string(),
        background_color: z4.string().nullable(),
        primary_color: z4.string().nullable(),
        secondary_color: z4.string().nullable(),
        tertiary_color: z4.string().nullable(),
    })
    .readonly()

export type PlayableItemArtwork = z4.infer<typeof PlayableItemArtwork>

export const PlayableItemSource = z4
    .object({
        url: z4.string(),
        mime_type: z4.string().nullable(),
    })
    .readonly()

export type PlayableItemSource = z4.infer<typeof PlayableItemSource>

export const PlayableItem = z4
    .object({
        id: z4.union([z4.string(), z4.number()]),
        artist_name: z4.string().nullish(),
        album_title: z4.string().nullish(),
        artworks: z4.array(PlayableItemArtwork).readonly().optional(),
        sources: z4.array(PlayableItemSource).readonly().optional(),
        start_time: z4.number(),
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

export type PlayableItem = z4.infer<typeof PlayableItem>

export const PlaybackState = z4.enum(["playing", "paused", "stopped"])
export type PlaybackState = z4.infer<typeof PlaybackState>

export const PlaybackTime = z4.object({
    totalTime: z4.number().nullable(),
    elapsedTime: z4.number().nullable(),
})
export type PlaybackTime = z4.infer<typeof PlaybackTime>

export const ReplaceQueueOptions = z4.object({
    newQueueItems: z4.array(PlayableItem).readonly(),
    startingItem: PlayableItem.optional().readonly(),
    playNow: z4.boolean().optional().readonly(),
})
export type ReplaceQueueOptions = z4.infer<typeof ReplaceQueueOptions>

export const NowPlaying = z4.object({
    state: PlaybackState,
    item: PlayableItem.nullable(),
})
export type NowPlaying = z4.infer<typeof NowPlaying>

/**
 * A protocol which allows an extension to interact with the player in the host.
 */
export const PlayerProtocol = protocol("Magritte.Host.Player", {
    /** Retrieve the current playback time and total time. */
    getCurrentTime: {
        input: z4.void(),
        output: PlaybackTime,
    },

    /** Seek to a new playback time. */
    seek: {
        input: z4.object({
            newTime: z4.number(),
        }),
        output: z4.void(),
    },

    /** Get the current playback state and item. */
    getNowPlaying: {
        input: z4.void(),
        output: NowPlaying,
    },

    /** Replace any existing queue with a new one. */
    replaceQueue: {
        input: ReplaceQueueOptions,
        output: z4.void(),
    },

    /** Pause playback. */
    pause: {
        input: z4.void(),
        output: z4.void(),
    },

    /** Resume playback. */
    resume: {
        input: z4.void(),
        output: z4.void(),
    },

    /** Skip to the previous item. */
    skipPrevious: {
        input: z4.void(),
        output: z4.void(),
    },

    /** Skip to the next item. */
    skipNext: {
        input: z4.void(),
        output: z4.void(),
    },
})

export type Player = ProtocolObject<typeof PlayerProtocol>
