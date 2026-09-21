import { defineBroadcast, protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod"

import { PlayableItemSchema } from "./items"
import { PlaybackStateSchema } from "./state"

export const PlaybackTimeSchema = z4.object({
    totalTime: z4.number().nullable(),
    elapsedTime: z4.number().nullable(),
})
export type PlaybackTime = z4.infer<typeof PlaybackTimeSchema>

export const ReplaceQueueOptionsSchema = z4.object({
    newQueueItems: z4.array(PlayableItemSchema).readonly(),
    startingItem: PlayableItemSchema.optional().readonly(),
    playNow: z4.boolean().optional().readonly(),
})
export type ReplaceQueueOptions = z4.infer<typeof ReplaceQueueOptionsSchema>

export const NowPlayingSchema = z4.object({
    state: PlaybackStateSchema,
    item: PlayableItemSchema.nullable(),
})
export type NowPlaying = z4.infer<typeof NowPlayingSchema>

/**
 * A protocol which allows an extension to interact with the player in the host.
 */
export const PlayerProtocol = protocol("Magritte.Host.Player", {
    /** Retrieve the current playback time and total time. */
    getCurrentTime: {
        input: z4.void(),
        output: PlaybackTimeSchema,
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
        output: NowPlayingSchema,
    },

    /** Replace any existing queue with a new one. */
    replaceQueue: {
        input: ReplaceQueueOptionsSchema,
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

export const PlayerNowPlayingDidChange = defineBroadcast(
    PlayerProtocol.name,
    "nowPlayingDidChange",
    z4.void(),
)
