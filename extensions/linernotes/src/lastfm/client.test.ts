import { describe, expect, it, vi } from "vitest"

import { LastfmClient, LastfmError, LastfmNetworkError, parseProse } from "@/lastfm/client"

type FetchMock = ReturnType<typeof respondWith>

/** A `fetch` which always answers with the same JSON payload */
function respondWith(payload: unknown, { status = 200 } = {}) {
    return vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
            new Response(JSON.stringify(payload), { status }),
    )
}

function makeClient(fetch: FetchMock) {
    return new LastfmClient({ apiKey: "the-key", fetch: fetch as typeof globalThis.fetch })
}

function requestParameters(fetch: FetchMock): URLSearchParams {
    return new URL(String(fetch.mock.calls[0][0])).searchParams
}

const BIO = {
    summary:
        'Nirvana was an American rock band. <a href="https://www.last.fm/music/Nirvana">Read more on Last.fm</a>',
    content:
        'Nirvana was an American rock band.\n\nFormed in 1987. <a href="https://www.last.fm/music/Nirvana">Read more on Last.fm</a>.',
}

describe("parseProse", () => {
    it("prefers the longer content and strips the read more link", () => {
        expect(parseProse(BIO, "fallback")).toEqual({
            source: "lastfm",
            text: "Nirvana was an American rock band.\n\nFormed in 1987.",
            sourceUrl: "https://www.last.fm/music/Nirvana",
        })
    })

    it("is null when there is nothing to read", () => {
        expect(
            parseProse({ summary: ' <a href="x">Read more on Last.fm</a>' }, "fallback"),
        ).toBeNull()
        expect(parseProse(undefined, "fallback")).toBeNull()
    })

    it("falls back to the given url", () => {
        expect(parseProse({ summary: "Just text." }, "fallback")?.sourceUrl).toBe("fallback")
    })
})

describe("LastfmClient", () => {
    it("knows whether it has a key", () => {
        expect(makeClient(respondWith({})).hasCredentials).toBe(true)
        expect(new LastfmClient({ apiKey: "", fetch: respondWith({}) as any }).hasCredentials).toBe(
            false,
        )
    })

    it("reads artist info by MusicBrainz id", async () => {
        const fetch = respondWith({
            artist: {
                name: "Nirvana",
                url: "https://www.last.fm/music/Nirvana",
                stats: { listeners: "5000000", playcount: "300000000" },
                tags: { tag: [{ name: "grunge" }, { name: "rock" }] },
                similar: {
                    artist: [
                        { name: "Foo Fighters", url: "https://www.last.fm/music/Foo+Fighters" },
                    ],
                },
                bio: BIO,
            },
        })
        const info = await makeClient(fetch).getArtistInfo({ mbid: "mbid-1" })

        expect(info?.stats).toEqual({ listeners: 5_000_000, playCount: 300_000_000 })
        expect(info?.tags).toEqual(["grunge", "rock"])
        expect(info?.similar).toEqual([
            { name: "Foo Fighters", url: "https://www.last.fm/music/Foo+Fighters" },
        ])
        expect(info?.bio?.text).toContain("Formed in 1987.")
        const parameters = requestParameters(fetch)
        expect(parameters.get("method")).toBe("artist.getInfo")
        expect(parameters.get("mbid")).toBe("mbid-1")
        expect(parameters.get("api_key")).toBe("the-key")
        expect(parameters.get("format")).toBe("json")
        expect(parameters.get("autocorrect")).toBe("1")
        expect(fetch.mock.calls[0][1]?.method).toBe("GET")
    })

    it("reads artist info by name", async () => {
        const fetch = respondWith({ artist: { name: "Nirvana" } })
        await makeClient(fetch).getArtistInfo({ name: "Nirvana" })
        expect(requestParameters(fetch).get("artist")).toBe("Nirvana")
    })

    it("reads album info with tracks in seconds", async () => {
        const fetch = respondWith({
            album: {
                name: "Nevermind",
                artist: "Nirvana",
                url: "https://www.last.fm/music/Nirvana/Nevermind",
                listeners: "2000000",
                playcount: "90000000",
                image: [
                    { "#text": "small.jpg", size: "small" },
                    { "#text": "large.jpg", size: "large" },
                ],
                tracks: {
                    track: [
                        { name: "Smells Like Teen Spirit", duration: 301, "@attr": { rank: 1 } },
                    ],
                },
                tags: { tag: [{ name: "grunge" }] },
                wiki: { summary: "A record." },
            },
        })
        const info = await makeClient(fetch).getAlbumInfo("Nirvana", "Nevermind")

        expect(info?.tracks).toEqual([
            { rank: 1, name: "Smells Like Teen Spirit", durationSec: 301 },
        ])
        expect(info?.imageUrl).toBe("large.jpg")
        expect(info?.wiki?.sourceUrl).toBe("https://www.last.fm/music/Nirvana/Nevermind")
        const parameters = requestParameters(fetch)
        expect(parameters.get("method")).toBe("album.getInfo")
        expect(parameters.get("artist")).toBe("Nirvana")
        expect(parameters.get("album")).toBe("Nevermind")
    })

    it("reads track info with the duration in milliseconds", async () => {
        const fetch = respondWith({
            track: {
                name: "Lithium",
                artist: { name: "Nirvana" },
                url: "https://www.last.fm/music/Nirvana/_/Lithium",
                duration: "256000",
                listeners: "1000",
                playcount: "5000",
                toptags: { tag: [{ name: "grunge" }] },
            },
        })
        const info = await makeClient(fetch).getTrackInfo("Nirvana", "Lithium")

        expect(info?.durationMs).toBe(256_000)
        expect(info?.artist).toBe("Nirvana")
        expect(info?.tags).toEqual(["grunge"])
        expect(info?.wiki).toBeNull()
        expect(requestParameters(fetch).get("track")).toBe("Lithium")
    })

    it("treats an unknown artist as nothing rather than a failure", async () => {
        const fetch = respondWith(
            { error: 6, message: "The artist you supplied could not be found" },
            { status: 400 },
        )
        expect(await makeClient(fetch).getArtistInfo({ name: "Nobody" })).toBeNull()
    })

    it("reports other Last.fm errors", async () => {
        const fetch = respondWith({ error: 10, message: "Invalid API key" }, { status: 403 })
        const error = await makeClient(fetch)
            .getArtistInfo({ name: "Nirvana" })
            .catch((error) => error)
        expect(error).toBeInstanceOf(LastfmError)
        expect(error.code).toBe(10)
    })

    it("wraps network failures", async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError("offline")
        })
        await expect(
            makeClient(fetch as unknown as FetchMock).getTrackInfo("a", "b"),
        ).rejects.toBeInstanceOf(LastfmNetworkError)
    })
})
