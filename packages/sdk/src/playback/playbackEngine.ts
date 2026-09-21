import { defineBroadcast, protocol, type ProtocolObject } from "@magritte/rpc"
import z4 from "zod/v4"

import { PlayableItemSchema } from "./items"
import { PlaybackTimeSchema } from "./player"
import { PlaybackStateSchema, PlaybackModesSchema } from "./state"

export const PlaybackEngineEnqueueOptionsSchema = z4
    .object({
        /**
         * The item to play, typically from the library, but may
         * be from other source like a streaming music service.
         * */
        itemToPlay: PlayableItemSchema,

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

export type PlaybackEngineEnqueueOptions = z4.infer<typeof PlaybackEngineEnqueueOptionsSchema>

export const PlaybackEngineProtocol = protocol("Magritte.Extension.PlaybackEngine", {
    /** Retrieve the current playback time and total time. */
    getCurrentTime: {
        input: z4.void(),
        output: PlaybackTimeSchema,
    },

    /** Get the current playback state and item. */
    getNowPlaying: {
        input: z4.void(),
        output: z4.object({
            playbackState: PlaybackStateSchema,
            playingItem: PlayableItemSchema.nullable(),
        }),
    },

    /** Synchronize the playback modes for this engine */
    syncPlaybackModes: { input: PlaybackModesSchema, output: z4.void() },

    /** Sync this engine's volume level */
    syncVolume: { input: z4.number().gte(0).lte(1), output: z4.void() },

    /** Check whether this playback engine can play a given item. */
    canEnqueue: {
        input: z4.object({ item: PlayableItemSchema }),
        output: z4.boolean(),
    },

    /** Enqueue an item to in order to play it with this engine. */
    enqueue: { input: PlaybackEngineEnqueueOptionsSchema, output: z4.void() },

    /**
     * Skip to the previous subdivision within the currently playing item.
     *
     * A subdivision can be a chapter within a podcast or audiobook,
     * or a song within a radio station. If the engine is playing an
     * item without subdivisions, it should return `false`.
     */
    skipPreviousItemSubdivision: { input: z4.void(), output: z4.boolean() },

    /**
     * Skip to the next subdivision within the currently playing item.
     *
     * A subdivision can be a chapter within a podcast or audiobook,
     * or a song within a radio station. If the engine is playing an
     * item without subdivisions, it should return `false`.
     */
    skipNextItemSubdivision: { input: z4.void(), output: z4.boolean() },

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
