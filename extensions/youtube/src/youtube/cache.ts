import type { MusicVideoLookup } from "@/youtube/types"

const STORAGE_KEY = "magritte.youtube.lookups"
const MAX_ENTRIES = 200
const MAX_AGE_MS = 30 * 24 * 60 * 60_000

interface Entry {
    readonly at: number
    readonly lookup: MusicVideoLookup
}

export interface LookupCacheOptions {
    /** `null` where the browser does not let an embedded page store anything */
    readonly storage?: Pick<Storage, "getItem" | "setItem"> | null
    readonly now?: () => number
}

function getLocalStorage(): Storage | null {
    try {
        return globalThis.localStorage
    } catch {
        return null
    }
}

/**
 * Remembers lookups between visits. Searching YouTube is expensive enough that
 * a day's quota only covers about a hundred songs, and replays should be free.
 */
export class LookupCache {
    private readonly _storage: LookupCacheOptions["storage"]
    private readonly _now: () => number

    constructor({ storage = getLocalStorage(), now = Date.now }: LookupCacheOptions = {}) {
        this._storage = storage
        this._now = now
    }

    private _read(): Record<string, Entry> {
        try {
            const entries = JSON.parse(this._storage?.getItem(STORAGE_KEY) ?? "{}")
            return entries !== null && typeof entries === "object" ? entries : {}
        } catch {
            return {}
        }
    }

    get(key: string): MusicVideoLookup | null {
        const entry = this._read()[key]
        return entry && this._now() - entry.at < MAX_AGE_MS ? entry.lookup : null
    }

    set(key: string, lookup: MusicVideoLookup): void {
        const now = this._now()
        const entries = Object.entries({ ...this._read(), [key]: { at: now, lookup } })
            .filter(([, entry]) => now - entry.at < MAX_AGE_MS)
            .sort(([, a], [, b]) => b.at - a.at)
            .slice(0, MAX_ENTRIES)
        try {
            this._storage?.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)))
        } catch {
            // Storage is full or forbidden, the lookup just won't be remembered
        }
    }
}
