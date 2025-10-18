export type PlaybackEngineState = "playing" | "paused" | "stopped"

export type PlaybackEngineEventDetail<Item extends {}> =
    | { type: "playbackStateDidChange" }
    | { type: "playingItemChanged" }
    | { type: "encounteredError"; error: Error }
    | { type: "endOfAudio"; lastItem: Item | null }
export type PlaybackEngineEvent<Item extends {}> = CustomEvent<
    PlaybackEngineEventDetail<Item>
>

export interface PlaybackEngineEnqueueOptions<Item extends {}> {
    /**
     * The item to play, typically from the library, but may
     * be from other source like a streaming music service.
     * */
    readonly itemToPlay: Item

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

export interface PlaybackEngine<Item extends {}> {
    readonly playingItem: Item | null
    readonly playbackState: PlaybackEngineState
    readonly totalTime: number | null
    readonly currentTime: number | null

    /** Enqueue an item to in order to play it with this engine. */
    enqueue(itemToPlay: PlaybackEngineEnqueueOptions<Item>): Promise<void>

    /**
     * Skip the currently playing item in the engine's queue to play the previous one.
     *
     * An engine which plays a single item at a time may simply return `false`
     * in its implementation of this method. It is only intended to be implemented
     * by engines which play audio from a source other than the library.
     */
    skipPreviousInQueue(): Promise<boolean>

    /**
     * Skip the currently playing item in the engine's queue to play the next one.
     *
     * An engine which plays a single item at a time may simply return `false`
     * in its implementation of this method. It is only intended to be implemented
     * by engines which play audio from a source other than the library.
     */
    skipNextInQueue(): Promise<boolean>

    seek(newTime: number): Promise<void>
    pause(): Promise<void>
    resume(): Promise<void>
    stop(): Promise<void>

    addEventListener(callback: (event: PlaybackEngineEvent<Item>) => void): void
    removeEventListener(
        callback: (event: PlaybackEngineEvent<Item>) => void,
    ): void
}
