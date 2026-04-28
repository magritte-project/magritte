import { RemoteEvent } from "@magritte/sdk/common"
import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackModes,
} from "@magritte/sdk/extension"
import type { PlayableItem, PlaybackState, PlaybackTime } from "@magritte/sdk/host"
import { createEvent, EventSink, type EventStream } from "@magritte/sdk/utilities"

function _getPlaybackState(playbackState: MusicKit.PlaybackStates): PlaybackState {
    switch (playbackState) {
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

export default class AppleMusicPlaybackEngine implements PlaybackEngine {
    private readonly _musicKit: MusicKit.Instance
    private readonly _events: EventSink<RemoteEvent>
    private _playingItem: PlayableItem | null

    constructor(musicKit: MusicKit.Instance) {
        this._musicKit = musicKit
        ;[this._events, this.$events] = createEvent<RemoteEvent>()
        this._playingItem = null

        this._musicKit.addEventListener("mediaPlaybackError", () =>
            this._handleMediaPlaybackError(),
        )
        this._musicKit.addEventListener("playbackStateDidChange", (event) =>
            this._handlePlaybackStateDidChange(event),
        )
    }

    readonly $events: EventStream<RemoteEvent>

    private _handleMediaPlaybackError() {
        this._events.dispatch({
            type: "PlaybackEngine.encounteredError",
            data: {},
        })
    }

    private _handlePlaybackStateDidChange(event: Parameters<MusicKit.StateChangeEventCallback>[0]) {
        this._events.dispatch({
            type: "PlaybackEngine.playbackStateDidChange",
            data: {},
        })

        switch (event.state) {
            case MusicKit.PlaybackStates.ended:
            case MusicKit.PlaybackStates.completed: {
                this.stop()
                this._events.dispatch({
                    type: "PlaybackEngine.endOfAudio",
                    data: {},
                })
                break
            }
            default:
                break
        }
    }

    async syncPlaybackModes(modes: PlaybackModes): Promise<void> {
        switch (modes.repeat) {
            case "off":
                this._musicKit.repeatMode = MusicKit.PlayerRepeatMode.none
                break
            case "one":
                this._musicKit.repeatMode = MusicKit.PlayerRepeatMode.one
                break
            case "all":
                this._musicKit.repeatMode = MusicKit.PlayerRepeatMode.all
                break
        }
        switch (modes.shuffle) {
            case "off":
                this._musicKit.shuffleMode = MusicKit.PlayerShuffleMode.off
                break
            case "on":
                this._musicKit.shuffleMode = MusicKit.PlayerShuffleMode.songs
                break
        }
    }

    async syncVolume(volume: number): Promise<void> {
        this._musicKit.volume = volume
    }

    async getNowPlaying(): Promise<{
        playbackState: PlaybackState
        playingItem: PlayableItem | null
    }> {
        return {
            playbackState: _getPlaybackState(this._musicKit.playbackState),
            playingItem: this._playingItem,
        }
    }

    async canEnqueue({ item }: { item: PlayableItem }): Promise<boolean> {
        const sources = item.sources ?? []
        return sources.some((source) => source.url.startsWith("applemusic://"))
    }

    async enqueue({ itemToPlay, playNow }: PlaybackEngineEnqueueOptions): Promise<void> {
        const sources = itemToPlay.sources ?? []
        const source = sources.find((source) => source.url.startsWith("applemusic://"))
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
        this._events.dispatch({
            type: "PlaybackEngine.playingItemChanged",
            data: {},
        })
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

    async getCurrentTime(): Promise<PlaybackTime> {
        return {
            totalTime: this._musicKit.currentPlaybackDuration,
            elapsedTime: this._musicKit.currentPlaybackTime,
        }
    }

    async seek({ newTime }: { newTime: number }): Promise<void> {
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
