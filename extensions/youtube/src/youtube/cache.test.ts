import { describe, expect, it } from "vitest"

import { LookupCache } from "@/youtube/cache"
import type { MusicVideoLookup } from "@/youtube/types"

const DAY_MS = 24 * 60 * 60_000

const LOOKUP: MusicVideoLookup = { kind: "artist", channel: null, videos: [] }

function makeStorage(initial: Record<string, string> = {}) {
    const values = new Map(Object.entries(initial))
    return {
        values,
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => void values.set(key, value),
    }
}

describe("LookupCache", () => {
    it("remembers lookups across instances", () => {
        const storage = makeStorage()
        new LookupCache({ storage }).set("nirvana|lithium", LOOKUP)

        const cache = new LookupCache({ storage })
        expect(cache.get("nirvana|lithium")).toEqual(LOOKUP)
        expect(cache.get("nirvana|polly")).toBeNull()
    })

    it("forgets lookups after a month", () => {
        let now = 0
        const cache = new LookupCache({ storage: makeStorage(), now: () => now })
        cache.set("a", LOOKUP)

        now = 29 * DAY_MS
        expect(cache.get("a")).toEqual(LOOKUP)
        now = 31 * DAY_MS
        expect(cache.get("a")).toBeNull()
    })

    it("keeps only the most recent lookups", () => {
        let now = 0
        const storage = makeStorage()
        const cache = new LookupCache({ storage, now: () => now })
        for (now = 0; now < 205; now++) {
            cache.set(`song-${now}`, LOOKUP)
        }
        expect(cache.get("song-4")).toBeNull()
        expect(cache.get("song-5")).toEqual(LOOKUP)
        expect(cache.get("song-204")).toEqual(LOOKUP)
    })

    it("works without storage, or with storage that is broken", () => {
        const none = new LookupCache({ storage: null, now: () => 0 })
        none.set("a", LOOKUP)
        expect(none.get("a")).toBeNull()

        const corrupt = new LookupCache({
            storage: makeStorage({ "magritte.youtube.lookups": "{" }),
        })
        expect(corrupt.get("a")).toBeNull()

        const full = new LookupCache({
            storage: {
                getItem: () => null,
                setItem: () => {
                    throw new Error("QuotaExceededError")
                },
            },
        })
        expect(() => full.set("a", LOOKUP)).not.toThrow()
    })
})
