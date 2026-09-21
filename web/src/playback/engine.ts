import type { PlayableItem, PlaybackState, PlaybackTime } from "@magritte/sdk"

import type { PlaybackModes } from "@/playback/modes"
import { type EventSubscribe } from "@/utilities/events"

export type PlaybackEngineEvent =
    | { type: "playbackStateDidChange"; playbackState: PlaybackState }
    | { type: "playingItemChanged" }
    | { type: "encounteredError"; error: Error }
    | { type: "endOfAudio"; lastItem: PlayableItem | null }

export interface PlaybackEngineEnqueueOptions {
    /**
     * The item to play, typically from the library, but may
     * be from other source like a streaming music service.
     * */
    readonly itemToPlay: PlayableItem

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
    readonly playNow?: boolean
}

export interface PlaybackEngine {
    /** Events relating to the state of this playback engine */
    readonly subscribe: EventSubscribe<PlaybackEngineEvent>

    /** Sync the playback modes for this engine */
    syncPlaybackModes(modes: PlaybackModes): Promise<void>

    /** Sync this engine's volume level */
    syncVolume(volume: number): Promise<void>

    /**
     * Check whether this playback engine can play a given item.
     *
     * @param item The item to check.
     * @returns `true` if the item can be enqueued in this engine; `false` otherwise.
     */
    canEnqueue(item: PlayableItem): Promise<boolean>

    /**
     * Enqueue an item to in order to play it with this engine.
     *
     * @param options The item to add and the behavior around that.
     */
    enqueue(options: PlaybackEngineEnqueueOptions): Promise<void>

    /**
     * Skip the currently playing item in the engine's queue to play the previous one.
     *
     * An engine which plays a single item at a time may simply return `false`
     * in its implementation of this method. It is only intended to be implemented
     * by engines which play audio from a source other than the library.
     */
    skipPreviousItemChapter(): Promise<boolean>

    /**
     * Skip the currently playing item in the engine's queue to play the next one.
     *
     * An engine which plays a single item at a time may simply return `false`
     * in its implementation of this method. It is only intended to be implemented
     * by engines which play audio from a source other than the library.
     */
    skipNextItemChapter(): Promise<boolean>

    getCurrentTime(): Promise<PlaybackTime>
    seek(newTime: number): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    stop(): Promise<void>
}
