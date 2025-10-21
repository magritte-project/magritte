import type { SongRead } from "@/api/openapi"
import { StorageUserSessionManager } from "@/api/userSession"
import {
    type PlaybackEngine,
    type PlaybackEngineEnqueueOptions,
    type PlaybackEngineEvent,
    type PlaybackEngineEventDetail,
    type PlaybackEngineState,
    createPlaybackEngineEvent,
} from "@/playback/engine"

export default class WebPlaybackEngine implements PlaybackEngine<SongRead> {
    private readonly _audio: HTMLAudioElement
    private readonly _eventTarget: EventTarget
    private _playingItem: SongRead | null

    // TODO: does this need to be a singleton?
    static readonly shared = new WebPlaybackEngine()

    constructor(parent: HTMLElement = document.body) {
        this._audio = new Audio()
        this._eventTarget = new EventTarget()
        this._playingItem = null

        this._audio.addEventListener("canplay", (e) => this._handleCanPlay(e))
        this._audio.addEventListener("durationchange", (e) =>
            this._handleDurationChange(e),
        )
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
        this._dispatchEvent({ type: "playbackStateDidChange" })
    }

    private _handleDurationChange(_event: Event) {
        this._dispatchEvent({ type: "playingItemChanged" })
    }

    private _handleEnded(_event: Event) {
        const lastItem = this._playingItem
        this.stop()
        this._dispatchEvent({ type: "endOfAudio", lastItem })
    }

    private _handleError(_event: Event) {
        this._dispatchEvent({ type: "encounteredError", error: new Error() })
    }

    private _handlePause(_event: Event) {
        this._dispatchEvent({ type: "playbackStateDidChange" })
    }

    private _handlePlay(_event: Event) {
        this._dispatchEvent({ type: "playbackStateDidChange" })
    }

    private _dispatchEvent(detail: PlaybackEngineEventDetail<SongRead>) {
        this._eventTarget.dispatchEvent(
            createPlaybackEngineEvent("onWebPlaybackEngineEvent", detail),
        )
    }

    get playingItem(): SongRead | null {
        return this._playingItem
    }

    get playbackState(): PlaybackEngineState {
        if (this._audio.src === "") {
            return "stopped"
        } else if (this._audio.paused) {
            return "paused"
        } else {
            return "playing"
        }
    }

    get totalTime(): number | null {
        return this._audio.duration
    }

    get currentTime(): number | null {
        return this._audio.currentTime
    }

    async canEnqueue(item: SongRead): Promise<boolean> {
        const sources = item.sources ?? []
        // TODO: this is nasty
        return sources.some(
            (source) =>
                this._audio.canPlayType(source.mime_type ?? "") &&
                source.url?.startsWith("magritte://"),
        )
    }

    async enqueue({
        itemToPlay,
        playNow,
    }: PlaybackEngineEnqueueOptions<SongRead>): Promise<void> {
        const sources = itemToPlay.sources ?? []
        const source = sources.find((source) =>
            source.url?.startsWith("magritte://"),
        )
        if (source === undefined || !source.url) {
            throw new Error("No compatible source in song")
        }
        // TODO: wow, fix this
        this._audio.src = `${source.url.replace("magritte://", "/api")}?token=${StorageUserSessionManager.local.current?.accessToken}`
        this._audio.load()

        this._playingItem = itemToPlay
        this._dispatchEvent({ type: "playingItemChanged" })

        if (playNow) {
            await this._audio.play()
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
        this._audio.src = ""
        this._playingItem = null
        this._dispatchEvent({ type: "playingItemChanged" })
    }

    addEventListener(
        callback: (event: PlaybackEngineEvent<SongRead>) => void,
    ): void {
        this._eventTarget.addEventListener(
            "onWebPlaybackEngineEvent",
            callback as EventListenerOrEventListenerObject,
        )
    }

    removeEventListener(
        callback: (event: PlaybackEngineEvent<SongRead>) => void,
    ): void {
        this._eventTarget.removeEventListener(
            "onWebPlaybackEngineEvent",
            callback as EventListenerOrEventListenerObject,
        )
    }
}
