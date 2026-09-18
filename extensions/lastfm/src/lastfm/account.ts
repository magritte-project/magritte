import type { LastfmSession } from "@/lastfm/client"

const STORAGE_KEY = "magritte.lastfm.account"

export interface LastfmAccountState {
    /** The signed in session, or `null` when nobody is signed in */
    readonly session: LastfmSession | null

    /** Whether newly played tracks are submitted to Last.fm */
    readonly isScrobblingEnabled: boolean
}

const defaultState: LastfmAccountState = {
    session: null,
    isScrobblingEnabled: true,
}

function parseState(raw: string | null): LastfmAccountState {
    if (raw === null) {
        return defaultState
    }
    try {
        const parsed = JSON.parse(raw)
        const session = parsed?.session
        return {
            session:
                typeof session?.key === "string"
                    ? {
                          key: session.key,
                          name: String(session.name ?? ""),
                          subscriber: session.subscriber === true,
                      }
                    : null,
            isScrobblingEnabled: parsed?.isScrobblingEnabled !== false,
        }
    } catch (error) {
        console.error("*** Discarding unreadable Last.fm account state", error)
        return defaultState
    }
}

/**
 * The signed in Last.fm account and the preferences attached to it.
 *
 * The state is persisted to local storage so the extension keeps its session
 * across reloads, and is observable so React views and the scrobbler both see
 * changes without one having to know about the other.
 */
export class LastfmAccount {
    private readonly _storage: Storage | null
    private readonly _listeners: Set<() => void>
    private _state: LastfmAccountState

    constructor(storage: Storage | null = globalThis.localStorage) {
        this._storage = storage
        this._listeners = new Set()
        this._state = parseState(this._read())

        // Another frame on this origin, such as a second copy of the extension,
        // may sign in or out while this one is running
        globalThis.addEventListener?.("storage", (event) => {
            if (event.key === STORAGE_KEY) {
                this._state = parseState(event.newValue)
                this._notify()
            }
        })
    }

    private _read(): string | null {
        try {
            return this._storage?.getItem(STORAGE_KEY) ?? null
        } catch (error) {
            // Storage can be unavailable, e.g. when a browser partitions third party frames
            console.error("*** Could not read Last.fm account state", error)
            return null
        }
    }

    private _write() {
        try {
            this._storage?.setItem(STORAGE_KEY, JSON.stringify(this._state))
        } catch (error) {
            console.error("*** Could not persist Last.fm account state", error)
        }
    }

    private _notify() {
        for (const listener of this._listeners) {
            try {
                listener()
            } catch (error) {
                console.error("*** Discarding error thrown by account listener", error)
            }
        }
    }

    private _update(changes: Partial<LastfmAccountState>) {
        this._state = { ...this._state, ...changes }
        this._write()
        this._notify()
    }

    /** The current state, stable until something changes so it is safe to snapshot */
    get state(): LastfmAccountState {
        return this._state
    }

    get session(): LastfmSession | null {
        return this._state.session
    }

    get isSignedIn(): boolean {
        return this._state.session !== null
    }

    get isScrobblingEnabled(): boolean {
        return this._state.isScrobblingEnabled
    }

    /** Whether scrobbles should actually be submitted right now */
    get isScrobblingActive(): boolean {
        return this.isSignedIn && this._state.isScrobblingEnabled
    }

    signIn(session: LastfmSession) {
        this._update({ session })
    }

    signOut() {
        this._update({ session: null })
    }

    setScrobblingEnabled(isScrobblingEnabled: boolean) {
        this._update({ isScrobblingEnabled })
    }

    subscribe(listener: () => void): () => void {
        this._listeners.add(listener)
        return () => {
            this._listeners.delete(listener)
        }
    }
}
