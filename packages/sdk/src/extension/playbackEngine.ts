import { defineBroadcast, protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { PlayableItem, PlaybackState, PlaybackTime } from "../host/playback"

export type PlaybackEngineEventTypes =
    | "PlaybackEngine.playbackStateDidChange"
    | "PlaybackEngine.playingItemChanged"
    | "PlaybackEngine.encounteredError"
    | "PlaybackEngine.endOfAudio"

export const RepeatMode = z4.enum(["off", "one", "all"])
export type RepeatMode = z4.infer<typeof RepeatMode>

export const ShuffleMode = z4.enum(["off", "on"])
export type ShuffleMode = z4.infer<typeof ShuffleMode>

export const PlaybackModes = z4
    .object({
        repeat: RepeatMode,
        shuffle: ShuffleMode,
    })
    .readonly()
export type PlaybackModes = z4.infer<typeof PlaybackModes>

export const PlaybackEngineEnqueueOptions = z4
    .object({
        /**
         * The item to play, typically from the library, but may
         * be from other source like a streaming music service.
         * */
        itemToPlay: PlayableItem,

        /**
         * Whether to immediately start playback of the item.
         *
         * The following behavior is prescribed for the `playNow` parameter:
         *
         * - if `playNow == true`: The engine is expected to begin the process of playing
         *   the item before returning, interrupting any other engine which may be playing. The engine
         *   can generally expect it will have priority and be able to successfully interrupt. The playback
         *   state of the engine should ideally be `playing` once this method returns.
         * - if `playNow == false`: The engine is expected to set up all of the infrastructure
         *   needed to play the item, possibly preloading a stream. It must be possible to start playback
         *   of the item with a subsequent call to `resume()`. The playback state of the engine should
         *   ideally be `paused` once this method returns.
         */
        playNow: z4.boolean().optional(),
    })
    .readonly()

export type PlaybackEngineEnqueueOptions = z4.infer<typeof PlaybackEngineEnqueueOptions>

export const PlaybackEngineProtocol = protocol("Magritte.Extension.PlaybackEngine", {
    /** Retrieve the current playback time and total time. */
    getCurrentTime: {
        input: z4.void(),
        output: PlaybackTime,
    },

    /** Get the current playback state and item. */
    getNowPlaying: {
        input: z4.void(),
        output: z4.object({
            playbackState: PlaybackState,
            playingItem: PlayableItem.nullable(),
        }),
    },

    /** Synchronize the playback modes for this engine */
    syncPlaybackModes: { input: PlaybackModes, output: z4.void() },

    /** Sync this engine's volume level */
    syncVolume: { input: z4.number().gte(0).lte(1), output: z4.void() },

    /** Check whether this playback engine can play a given item. */
    canEnqueue: {
        input: z4.object({ item: PlayableItem }),
        output: z4.boolean(),
    },

    /** Enqueue an item to in order to play it with this engine. */
    enqueue: { input: PlaybackEngineEnqueueOptions, output: z4.void() },

    /**
     * Skip the currently playing item in the engine's queue to play the previous one.
     *
     * An engine which plays a single item at a time may simply return `false`
     * in its implementation of this method. It is only intended to be implemented
     * by engines which play audio from a source other than the library.
     */
    skipPreviousInQueue: { input: z4.void(), output: z4.boolean() },

    /**
     * Skip the currently playing item in the engine's queue to play the next one.
     *
     * An engine which plays a single item at a time may simply return `false`
     * in its implementation of this method. It is only intended to be implemented
     * by engines which play audio from a source other than the library.
     */
    skipNextInQueue: { input: z4.void(), output: z4.boolean() },

    seek: {
        input: z4.object({ newTime: z4.number() }),
        output: z4.void(),
    },
    pause: { input: z4.void(), output: z4.void() },
    resume: { input: z4.void(), output: z4.void() },
    stop: { input: z4.void(), output: z4.void() },
})

export type PlaybackEngine = ProtocolObject<typeof PlaybackEngineProtocol>

export const PlaybackEnginePlaybackStateDidChange = defineBroadcast(
    PlaybackEngineProtocol.name,
    "playbackStateDidChange",
    z4.void(),
)
export const PlaybackEnginePlayingItemChanged = defineBroadcast(
    PlaybackEngineProtocol.name,
    "playingItemChanged",
    z4.void(),
)
export const PlaybackEngineEncounteredError = defineBroadcast(
    PlaybackEngineProtocol.name,
    "encounteredError",
    z4.object({ message: z4.string() }).optional(),
)
export const PlaybackEngineEndOfAudio = defineBroadcast(
    PlaybackEngineProtocol.name,
    "endOfAudio",
    z4.void(),
)
