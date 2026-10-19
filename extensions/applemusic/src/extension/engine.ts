import type { RPCBroadcaster } from "@magritte/rpc"
import {
    PlaybackEngineEncounteredError,
    PlaybackEngineEndOfAudio,
    PlaybackEnginePlaybackStateDidChange,
    PlaybackEnginePlayingItemChanged,
    type PlayableItem,
    type PlaybackEngine,
    type PlaybackEngineEnqueueOptions,
    type PlaybackModes,
    type PlaybackState,
    type PlaybackTime,
} from "@magritte/sdk"

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
    private readonly _broadcaster: RPCBroadcaster
    private readonly _musicKit: MusicKit.Instance
    private _playingItem: PlayableItem | null

    constructor(broadcaster: RPCBroadcaster, musicKit: MusicKit.Instance) {
        this._broadcaster = broadcaster
        this._musicKit = musicKit
        this._playingItem = null

        this._musicKit.addEventListener("drmUnsupported", () => {
            console.error(
                "*** This browser does not support DRM, playback will be limited to previews",
            )
        })
        this._musicKit.addEventListener("mediaPlaybackError", () =>
            this._handleMediaPlaybackError(),
        )
        this._musicKit.addEventListener("playbackStateDidChange", (event) =>
            this._handlePlaybackStateDidChange(event),
        )
    }

    private _handleMediaPlaybackError() {
        this._broadcaster.send(PlaybackEngineEncounteredError, undefined)
    }

    private _handlePlaybackStateDidChange(event: Parameters<MusicKit.StateChangeEventCallback>[0]) {
        this._broadcaster.send(PlaybackEnginePlaybackStateDidChange, undefined)

        switch (event.state) {
            case MusicKit.PlaybackStates.ended:
            case MusicKit.PlaybackStates.completed: {
                void this.stop()
                this._broadcaster.send(PlaybackEngineEndOfAudio, undefined)
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
        this._broadcaster.send(PlaybackEnginePlayingItemChanged, undefined)
    }

    async skipPreviousItemSubdivision(): Promise<boolean> {
        if (this._musicKit.queue.nextPlayableItem !== undefined) {
            await this._musicKit.skipToNextItem()
            return true
        } else {
            return false
        }
    }

    async skipNextItemSubdivision(): Promise<boolean> {
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
        this._playingItem = null
        await this._musicKit.stop()
    }
}
