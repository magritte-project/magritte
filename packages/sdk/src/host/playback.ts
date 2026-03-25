import { protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod"

export const zPlayableItemArtwork = z4
    .object({
        image_url: z4.string(),
        background_color: z4.string().nullable(),
        primary_color: z4.string().nullable(),
        secondary_color: z4.string().nullable(),
        tertiary_color: z4.string().nullable(),
    })
    .readonly()

export type PlayableItemArtwork = z4.infer<typeof zPlayableItemArtwork>

export const zPlayableItemSource = z4
    .object({
        url: z4.string(),
        mime_type: z4.string().nullable(),
    })
    .readonly()

export type PlayableItemSource = z4.infer<typeof zPlayableItemSource>

export const zPlayableItem = z4
    .object({
        id: z4.unknown(),
        artist_name: z4.string().nullish(),
        album_title: z4.string().nullish(),
        artworks: z4.array(zPlayableItemArtwork).readonly().optional(),
        sources: z4.array(zPlayableItemSource).readonly().optional(),
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

export type PlayableItem = z4.infer<typeof zPlayableItem>

export const zPlaybackState = z4.enum(["playing", "paused", "stopped"])
export type PlaybackState = z4.infer<typeof zPlaybackState>

/**
 * A protocol which allows an extension to interact with the player in the host.
 */
export const PlayerProtocol = protocol("Magritte.Host.Player", {
    /** Retrieve the current playback time and total time. */
    getCurrentTime: {
        input: z4.void(),
        output: z4.object({
            currentTime: z4.number().nullable(),
            totalTime: z4.number().nullable(),
        }),
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
        output: z4.object({
            state: zPlaybackState,
            item: zPlayableItem.nullable(),
        }),
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
