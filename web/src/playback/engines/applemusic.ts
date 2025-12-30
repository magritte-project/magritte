import type { SongRead } from "@/api/openapi"
import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
    PlaybackEngineState,
} from "@/playback/engine"
import {
    createEvent,
    type EventSink,
    type EventStream,
} from "@/utilities/events"

export default class AppleMusicPlaybackEngine
    implements PlaybackEngine<SongRead>
{
    private _musicKit: MusicKit.Instance
    private readonly _events: EventSink<PlaybackEngineEvent<SongRead>>
    private _playingItem: SongRead | null

    constructor() {
        this._musicKit = MusicKit.getInstance()
        ;[this._events, this.$events] = createEvent()

        this._playingItem = null

        this._musicKit.addEventListener("mediaPlaybackError", () =>
            this._handleMediaPlaybackError(),
        )
        this._musicKit.addEventListener("playbackStateDidChange", (event) =>
            this._handlePlaybackStateDidChange(event),
        )
    }

    private _handleMediaPlaybackError() {
        this._events.dispatch({ type: "encounteredError", error: new Error() })
    }

    private _handlePlaybackStateDidChange(
        event: Parameters<MusicKit.StateChangeEventCallback>[0],
    ) {
        this._events.dispatch({ type: "playbackStateDidChange" })

        switch (event.state) {
            case MusicKit.PlaybackStates.ended:
            case MusicKit.PlaybackStates.completed: {
                const lastItem = this._playingItem
                this.stop()
                this._events.dispatch({ type: "endOfAudio", lastItem })
                break
            }
            default:
                break
        }
    }

    get playingItem(): SongRead | null {
        return this._playingItem
    }

    get playbackState(): PlaybackEngineState {
        switch (this._musicKit.playbackState) {
            case MusicKit.PlaybackStates.none:
            case MusicKit.PlaybackStates.loading:
            case MusicKit.PlaybackStates.stopped:
            case MusicKit.PlaybackStates.ended:
            case MusicKit.PlaybackStates.completed:
                return "stopped"
            case MusicKit.PlaybackStates.waiting:
            case MusicKit.PlaybackStates.stalled:
            case MusicKit.PlaybackStates.seeking:
            case MusicKit.PlaybackStates.playing:
                return "playing"
            case MusicKit.PlaybackStates.paused:
                return "paused"
            default:
                return "stopped"
        }
    }

    get totalTime(): number | null {
        return this._musicKit.currentPlaybackDuration
    }

    get currentTime(): number | null {
        return this._musicKit.currentPlaybackTime
    }

    readonly $events: EventStream<PlaybackEngineEvent<SongRead>>

    async canEnqueue(item: SongRead): Promise<boolean> {
        const sources = item.sources ?? []
        return sources.some((source) => source.url.startsWith("applemusic://"))
    }

    async enqueue({
        itemToPlay,
        playNow,
    }: PlaybackEngineEnqueueOptions<SongRead>): Promise<void> {
        const sources = itemToPlay.sources ?? []
        const source = sources.find((source) =>
            source.url.startsWith("applemusic://"),
        )
        if (source === undefined) {
            throw new Error("No compatible source in song")
        }
        // TODO: This is nasty
        const sourceUrl = new URL(source.url)
        const [, kind, id] = sourceUrl.pathname.split("/")
        switch (kind) {
            case "songs":
                await this._musicKit.setQueue({
                    song: id,
                    startPlaying: playNow,
                })
                break
            default:
                throw new Error(`Unsupported kind ${kind}`)
        }

        this._playingItem = itemToPlay
        this._events.dispatch({ type: "playingItemChanged" })
    }

    async skipPreviousInQueue(): Promise<boolean> {
        if (this._musicKit.queue.nextPlayableItem !== undefined) {
            await this._musicKit.skipToNextItem()
            return true
        } else {
            return false
        }
    }

    async skipNextInQueue(): Promise<boolean> {
        if (this._musicKit.queue.previousPlayableItem !== undefined) {
            await this._musicKit.skipToPreviousItem()
            return true
        } else {
            return false
        }
    }

    async seek(newTime: number): Promise<void> {
        await this._musicKit.seekToTime(newTime)
    }

    async pause(): Promise<void> {
        this._musicKit.pause()
    }

    async resume(): Promise<void> {
        this._musicKit.play()
    }

    async stop(): Promise<void> {
        this._musicKit.stop()
        this._playingItem = null
    }
}
