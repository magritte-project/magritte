import type { SongRead } from "@/api/openapi"
import type {
    PlaybackEngine,
    PlaybackEngineEnqueueOptions,
    PlaybackEngineEvent,
} from "@/playback/engine"
import { Queue } from "@/playback/queue"
import WebPlaybackEngine from "./engines/web"

// TODO: spin this out into a dynamic registry
const allEngines: readonly PlaybackEngine<SongRead>[] = [
    WebPlaybackEngine.shared,
]

async function engineToPlay(
    item: SongRead,
): Promise<PlaybackEngine<SongRead> | null> {
    for (const engine of allEngines) {
        if (await engine.canEnqueue(item)) {
            return engine
        }
    }
    return null
}

export interface ReplaceQueueOptions
    extends Omit<PlaybackEngineEnqueueOptions<SongRead>, "itemToPlay"> {
    readonly newQueue: Queue<string, SongRead>
    // TODO: really need to support starting ID here...
}

export class Player {
    private _activeEngine: PlaybackEngine<SongRead> | null
    private _eventForwarder: (event: PlaybackEngineEvent<SongRead>) => void
    private _queue: Queue<string, SongRead>
    private _currentShardId: string | null
    private _currentItem: SongRead | null

    // TODO: put this in the react tree
    static readonly shared = new Player()

    constructor() {
        this._activeEngine = null
        this._eventForwarder = (e) => this._handleEngineEvent(e)
        this._queue = new Queue([])
        this._currentShardId = null
        this._currentItem = null
    }

    private _changeEngine(newEngine: PlaybackEngine<SongRead> | null) {
        if (this._activeEngine === newEngine) {
            return
        }
        if (this._activeEngine !== null) {
            this._activeEngine.stop()
            this._activeEngine.removeEventListener(this._eventForwarder)
        }
        this._activeEngine = newEngine
        if (newEngine !== null) {
            newEngine.addEventListener(this._eventForwarder)
        }
    }

    private async _handleEngineEvent(
        event: PlaybackEngineEvent<SongRead>,
    ): Promise<void> {
        switch (event.detail.type) {
            case "playbackStateDidChange": {
                // TODO: handle this
                break
            }
            case "playingItemChanged": {
                // TODO: handle this
                break
            }
            case "encounteredError": {
                // TODO: handle this
                break
            }
            case "endOfAudio": {
                if (
                    this._currentShardId === null ||
                    this._currentItem === null
                ) {
                    return
                }
                const result = await this._queue.itemFollowing(
                    this._currentShardId,
                    this._currentItem,
                )
                if (result === null) {
                    return
                }
                const [shardId, nextItem] = result
                const engine = await engineToPlay(nextItem)
                if (engine === null) {
                    return // TODO: handle error
                }
                this._changeEngine(engine)
                this._currentShardId = shardId
                this._currentItem = nextItem
                await engine.enqueue({ itemToPlay: nextItem, playNow: true })
                break
            }
        }
    }

    async replaceQueue({
        newQueue,
        ...rest
    }: ReplaceQueueOptions): Promise<void> {
        await this._activeEngine?.stop()

        this._queue = newQueue
        const result = await newQueue.firstItem()
        if (result === null) {
            return // shrug
        }
        const [shardId, upFirst] = result
        const engine = await engineToPlay(upFirst)
        if (engine === null) {
            return // TODO: handle error
        }
        this._changeEngine(engine)
        this._currentShardId = shardId
        this._currentItem = upFirst
        await engine.enqueue({ itemToPlay: upFirst, ...rest })
    }
}
