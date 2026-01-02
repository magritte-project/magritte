import type { UserSessionManager } from "@/api/userSession"
import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
    PlaybackEngineState,
} from "@/playback/engine"
import type { PlayableItem } from "@/playback/item"

import { type EventSink, type EventStream, createEvent } from "@/utilities/events"
import { resolveUrl } from "@/utilities/resources"

export default class WebPlaybackEngine implements PlaybackEngine {
    private readonly _userSession: UserSessionManager
    private readonly _audio: HTMLAudioElement
    private readonly _events: EventSink<PlaybackEngineEvent>
    private _playingItem: PlayableItem | null

    constructor(userSession: UserSessionManager, parent: HTMLElement = document.body) {
        this._userSession = userSession
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
        this._events.dispatch({ type: "playbackStateDidChange" })
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
        this._events.dispatch({ type: "encounteredError", error: new Error() })
    }

    private _handlePause(_event: Event) {
        this._events.dispatch({ type: "playbackStateDidChange" })
    }

    private _handlePlay(_event: Event) {
        this._events.dispatch({ type: "playbackStateDidChange" })
    }

    get playingItem(): PlayableItem | null {
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

    readonly $events: EventStream<PlaybackEngineEvent>

    async canEnqueue(item: PlayableItem): Promise<boolean> {
        const sources = item.sources ?? []
        // TODO: this is nasty
        return sources.some(
            (source) =>
                this._audio.canPlayType(source.mime_type ?? "") &&
                source.url.startsWith("magritte://"),
        )
    }

    async enqueue({ itemToPlay, playNow }: PlaybackEngineEnqueueOptions): Promise<void> {
        const sources = itemToPlay.sources ?? []
        const source = sources.find((source) => source.url.startsWith("magritte://"))
        const audioSrc = source?.url ? resolveUrl(source.url, this._userSession.current) : null
        if (source === undefined || !audioSrc) {
            throw new Error("No compatible source in song")
        }
        this._audio.src = audioSrc
        this._audio.load()

        this._playingItem = itemToPlay
        this._events.dispatch({ type: "playingItemChanged" })

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
        this._events.dispatch({ type: "playingItemChanged" })
    }
}
