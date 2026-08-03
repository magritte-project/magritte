import type { API, FileAccess } from "@magritte/api"
import { PlayableItem, PlaybackState, PlaybackTime } from "@magritte/sdk"

import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
} from "@/playback/engine"
import type { PlaybackModes } from "@/playback/modes"
import { createEvent, type EventSink, type EventStream } from "@/utilities/events"
import { resolveUrl } from "@/utilities/resources"

import type { LocalCache } from "./localFileCache"

function _findBestUrl(item: PlayableItem): string | undefined {
    const sources = item.sources
    if (sources === undefined) {
        return undefined
    }
    return sources.find((source) => source.url.startsWith("magritte://"))?.url
}

function _getPlaybackState(audio: HTMLAudioElement): PlaybackState {
    if (audio.src === "") {
        return "stopped"
    } else if (audio.paused) {
        return "paused"
    } else {
        return "playing"
    }
}

export default class BuiltInPlaybackEngine implements PlaybackEngine {
    private readonly _fileAccess: FileAccess
    private readonly _localCache: LocalCache
    private readonly _audio: HTMLAudioElement
    private readonly _events: EventSink<PlaybackEngineEvent>
    private _playingItem: PlayableItem | null

    constructor(api: API, localCache: LocalCache, parent: HTMLElement = document.body) {
        this._fileAccess = api.fileAccess
        this._localCache = localCache
        this._audio = new Audio()
        ;[this._events, this.$events] = createEvent()

        this._playingItem = null

        this._audio.addEventListener("canplay", (e) => this._handleCanPlay(e))
        this._audio.addEventListener("durationchange", (e) => this._handleDurationChange(e))
        this._audio.addEventListener("ended", (e) => this._handleEnded(e))
        this._audio.addEventListener("error", (e) => this._handleError(e))
        this._audio.addEventListener("pause", (e) => this._handlePause(e))
        this._audio.addEventListener("play", (e) => this._handlePlay(e))

        this._audio.style.width = "0"
        this._audio.style.height = "0"
        this._audio.style.display = "none"
        parent.appendChild(this._audio)
    }

    private _handleCanPlay(_event: Event) {
        this._events.dispatch({
            type: "playbackStateDidChange",
            playbackState: _getPlaybackState(this._audio),
        })
    }

    private _handleDurationChange(_event: Event) {
        this._events.dispatch({ type: "playingItemChanged" })
    }

    private _handleEnded(_event: Event) {
        const lastItem = this._playingItem
        this.stop()
        this._events.dispatch({ type: "endOfAudio", lastItem })
    }

    private _handleError(_event: Event) {
        const mediaError = this._audio.error
        this._events.dispatch({
            type: "encounteredError",
            error: new Error(
                mediaError ? `${mediaError.message} (${mediaError.code})` : "Unknown error",
            ),
        })
    }

    private _handlePause(_event: Event) {
        this._events.dispatch({
            type: "playbackStateDidChange",
            playbackState: _getPlaybackState(this._audio),
        })
    }

    private _handlePlay(_event: Event) {
        this._events.dispatch({
            type: "playbackStateDidChange",
            playbackState: _getPlaybackState(this._audio),
        })
    }

    private _swapSrc(newSrc: string) {
        const oldSrc = this._audio.src
        this._audio.src = newSrc
        if (oldSrc.startsWith("blob:")) {
            console.debug("Revoking local file blob for stopped playback")
            URL.revokeObjectURL(oldSrc)
        }
    }

    readonly $events: EventStream<PlaybackEngineEvent>

    async syncPlaybackModes(_modes: PlaybackModes): Promise<void> {
        /** Nothing to do in this engine */
    }

    async syncVolume(volume: number): Promise<void> {
        this._audio.volume = volume
    }

    async canEnqueue(item: PlayableItem): Promise<boolean> {
        return _findBestUrl(item) !== undefined
    }

    async enqueue({ itemToPlay, playNow }: PlaybackEngineEnqueueOptions): Promise<void> {
        const bestUrl = _findBestUrl(itemToPlay)
        if (bestUrl === undefined) {
            throw new Error("No compatible source in song")
        }
        const sourceFile = await this._localCache.getFile(bestUrl)
        if (sourceFile !== undefined) {
            console.debug("Issuing local file blob for playback")
            const audioSrc = URL.createObjectURL(sourceFile)
            this._swapSrc(audioSrc)
        } else {
            const token = await this._fileAccess.token()
            const audioSrc = resolveUrl(bestUrl, token)
            if (audioSrc === undefined) {
                throw new Error("Could not resolve song source URL")
            }
            this._swapSrc(audioSrc)
        }
        this._audio.load()

        this._playingItem = itemToPlay
        this._events.dispatch({ type: "playingItemChanged" })

        if (playNow) {
            await this._audio.play()
        }
    }

    async getCurrentTime(): Promise<PlaybackTime> {
        return {
            totalTime: this._audio.duration,
            elapsedTime: this._audio.currentTime,
        }
    }

    async skipPreviousInQueue(): Promise<boolean> {
        return false
    }

    async skipNextInQueue(): Promise<boolean> {
        return false
    }

    async seek(newTime: number): Promise<void> {
        this._audio.currentTime = newTime
    }

    async pause(): Promise<void> {
        this._audio.pause()
    }

    async resume(): Promise<void> {
        this._audio.play()
    }

    async stop(): Promise<void> {
        this._swapSrc("")
        this._playingItem = null
        this._events.dispatch({ type: "playingItemChanged" })
    }
}
