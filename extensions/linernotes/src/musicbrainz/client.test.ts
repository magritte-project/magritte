import { describe, expect, it, vi } from "vitest"

import { MusicBrainzClient, MusicBrainzError, MusicBrainzNetworkError } from "@/musicbrainz/client"
import { RateLimiter } from "@/musicbrainz/rateLimiter"

type FetchMock = ReturnType<typeof respondWith>

/** A `fetch` which answers each call with the next payload, repeating the last */
function respondWith(...responses: readonly unknown[]) {
    let index = 0
    return vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
        const next = responses[Math.min(index++, responses.length - 1)]
        return next instanceof Response ? next : new Response(JSON.stringify(next), { status: 200 })
    })
}

/** A limiter which never waits, so tests run instantly */
function instantLimiter() {
    return new RateLimiter({ intervalMs: 0 })
}

function makeClient(fetch: FetchMock) {
    return new MusicBrainzClient({
        fetch: fetch as typeof globalThis.fetch,
        limiter: instantLimiter(),
    })
}

function requestUrl(fetch: FetchMock, call = 0): URL {
    const [input] = fetch.mock.calls[call]
    return new URL(input instanceof Request ? input.url : input)
}

describe("MusicBrainzClient", () => {
    it("asks for JSON and the relationships an artist page needs", async () => {
        const fetch = respondWith({ id: "x", name: "Nirvana" })
        const artist = await makeClient(fetch).getArtist("x")

        expect(artist.name).toBe("Nirvana")
        const url = requestUrl(fetch)
        expect(url.origin + url.pathname).toBe("https://musicbrainz.org/ws/2/artist/x")
        expect(url.searchParams.get("fmt")).toBe("json")
        expect(url.searchParams.get("inc")).toBe("url-rels+tags+genres+artist-rels")
        expect(fetch.mock.calls[0][1]?.headers).toEqual({ Accept: "application/json" })
    })

    it("includes work-level relationships with releases", async () => {
        const fetch = respondWith({ id: "r" })
        await makeClient(fetch).getRelease("r")
        expect(requestUrl(fetch).searchParams.get("inc")).toContain("work-level-rels+work-rels")
    })

    it("builds a Lucene query, with the album when there is one", async () => {
        const fetch = respondWith({ recordings: [{ id: "hit", score: 100 }] })
        const client = makeClient(fetch)
        const hits = await client.searchRecordings({
            title: "Lithium",
            artist: "Nirvana",
            album: "Nevermind",
        })
        await client.searchRecordings({ title: "Lithium", artist: "Nirvana" })

        expect(hits.map((hit) => hit.id)).toEqual(["hit"])
        expect(requestUrl(fetch, 0).searchParams.get("query")).toBe(
            'recording:"Lithium" AND artist:"Nirvana" AND release:"Nevermind"',
        )
        expect(requestUrl(fetch, 0).searchParams.get("limit")).toBe("25")
        expect(requestUrl(fetch, 1).searchParams.get("query")).toBe(
            'recording:"Lithium" AND artist:"Nirvana"',
        )
    })

    it("retries once after being rate limited", async () => {
        const fetch = respondWith(new Response("", { status: 503 }), { id: "x" })
        const artist = await makeClient(fetch).getArtist("x")
        expect(artist.id).toBe("x")
        expect(fetch).toHaveBeenCalledTimes(2)
    })

    it("reports missing entities", async () => {
        const fetch = respondWith(new Response("", { status: 404 }))
        const error = await makeClient(fetch)
            .getArtist("nope")
            .catch((error) => error)
        expect(error).toBeInstanceOf(MusicBrainzError)
        expect(error.isNotFound).toBe(true)
    })

    it("wraps network failures", async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError("offline")
        })
        await expect(
            makeClient(fetch as unknown as FetchMock).getArtist("x"),
        ).rejects.toBeInstanceOf(MusicBrainzNetworkError)
    })

    it("pages through an artist's release groups", async () => {
        const page = (offset: number, ids: string[]) => ({
            "release-group-count": 3,
            "release-group-offset": offset,
            "release-groups": ids.map((id) => ({ id, title: id })),
        })
        const fetch = respondWith(page(0, ["a", "b"]), page(100, ["c"]))
        const groups = await makeClient(fetch).browseReleaseGroups("artist")

        expect(groups.map((group) => group.id)).toEqual(["a", "b", "c"])
        expect(fetch).toHaveBeenCalledTimes(2)
        const url = requestUrl(fetch, 1)
        expect(url.searchParams.get("artist")).toBe("artist")
        expect(url.searchParams.get("type")).toBe("album|ep")
        expect(url.searchParams.get("limit")).toBe("100")
        expect(url.searchParams.get("offset")).toBe("100")
    })

    it("runs every request through the shared limiter", async () => {
        const limiter = instantLimiter()
        const schedule = vi.spyOn(limiter, "schedule")
        const client = new MusicBrainzClient({
            fetch: respondWith({ id: "x" }) as typeof globalThis.fetch,
            limiter,
        })
        await client.getRecording("x")
        expect(schedule).toHaveBeenCalledTimes(1)
    })
})
