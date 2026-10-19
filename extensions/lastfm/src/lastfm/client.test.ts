import { describe, expect, it, vi } from "vitest"

import { LastfmClient, LastfmError, LastfmNetworkError, signParameters } from "@/lastfm/client"
import { md5 } from "@/lastfm/md5"

type FetchMock = ReturnType<typeof respondWith>

/** A `fetch` which always answers with the same JSON payload */
function respondWith(payload: unknown, { status = 200 } = {}) {
    // Declared with `fetch`'s parameters so the recorded calls keep their shape
    return vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
            new Response(JSON.stringify(payload), { status }),
    )
}

function makeClient(fetch: FetchMock | typeof globalThis.fetch) {
    return new LastfmClient({
        apiKey: "the-key",
        apiSecret: "the-secret",
        fetch: fetch as typeof globalThis.fetch,
    })
}

/** The parameters of the request a mocked `fetch` was called with, sent either way */
function requestParameters(fetch: FetchMock): URLSearchParams {
    const [input, init] = fetch.mock.calls[0]
    if (init?.body instanceof URLSearchParams) {
        return init.body
    }
    return new URL(input instanceof Request ? input.url : input).searchParams
}

describe("signParameters", () => {
    it("concatenates sorted name value pairs, then the secret", () => {
        expect(signParameters({ b: "2", a: "1" }, "secret")).toBe(md5("a1b2secret"))
    })

    it("leaves out the parameters Last.fm excludes", () => {
        const signature = signParameters({ a: "1" }, "secret")
        expect(signParameters({ a: "1", format: "json" }, "secret")).toBe(signature)
        expect(signParameters({ a: "1", api_sig: "stale" }, "secret")).toBe(signature)
    })

    it("leaves out parameters which were never set", () => {
        expect(signParameters({ a: "1", b: undefined }, "secret")).toBe(md5("a1secret"))
    })
})

describe("LastfmClient", () => {
    it("signs authenticated calls and asks for JSON", async () => {
        const fetch = respondWith({ token: "a-token" })
        const token = await makeClient(fetch).getToken()

        expect(token).toBe("a-token")
        const parameters = requestParameters(fetch)
        expect(parameters.get("method")).toBe("auth.getToken")
        expect(parameters.get("api_key")).toBe("the-key")
        expect(parameters.get("format")).toBe("json")
        expect(parameters.get("api_sig")).toBe(md5("api_keythe-keymethodauth.getTokenthe-secret"))
    })

    it("posts scrobbles as an indexed batch", async () => {
        const fetch = respondWith({ scrobbles: { scrobble: [] } })
        await makeClient(fetch).scrobble(
            [
                { artist: "A", track: "One", album: "Album", duration: 180.6, timestamp: 100 },
                { artist: "B", track: "Two", timestamp: 200 },
            ],
            "session-key",
        )

        const parameters = requestParameters(fetch)
        expect(parameters.get("artist[0]")).toBe("A")
        expect(parameters.get("track[0]")).toBe("One")
        expect(parameters.get("album[0]")).toBe("Album")
        // Last.fm wants a whole number of seconds
        expect(parameters.get("duration[0]")).toBe("181")
        expect(parameters.get("timestamp[0]")).toBe("100")
        expect(parameters.get("artist[1]")).toBe("B")
        // Absent details are left off rather than sent empty
        expect(parameters.get("album[1]")).toBeNull()
        expect(parameters.get("sk")).toBe("session-key")
    })

    it("reports the scrobbles Last.fm ignored", async () => {
        const fetch = respondWith({
            scrobbles: {
                scrobble: [
                    { ignoredMessage: { code: "0", "#text": "" } },
                    { ignoredMessage: { code: "1", "#text": "Artist was ignored" } },
                ],
            },
        })
        const scrobbles = [
            { artist: "A", track: "One", timestamp: 100 },
            { artist: "", track: "Two", timestamp: 200 },
        ]
        const ignored = await makeClient(fetch).scrobble(scrobbles, "session-key")

        expect(ignored).toEqual([{ scrobble: scrobbles[1], message: "Artist was ignored" }])
    })

    it("turns a Last.fm error payload into a LastfmError", async () => {
        const fetch = respondWith({ error: 9, message: "Invalid session key" }, { status: 403 })
        await expect(makeClient(fetch).getToken()).rejects.toThrow(
            new LastfmError(9, "Invalid session key"),
        )
    })

    it("tells a failed network apart from a refusal by Last.fm", async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError("Failed to fetch")
        }) as unknown as typeof globalThis.fetch
        await expect(makeClient(fetch).getToken()).rejects.toBeInstanceOf(LastfmNetworkError)
    })

    it("reads the recent tracks response", async () => {
        const fetch = respondWith({
            recenttracks: {
                track: [
                    {
                        name: "Playing Now",
                        artist: { "#text": "An Artist" },
                        album: { "#text": "An Album" },
                        url: "https://last.fm/one",
                        image: [
                            { "#text": "https://small.png", size: "small" },
                            { "#text": "https://large.png", size: "large" },
                        ],
                        "@attr": { nowplaying: "true" },
                    },
                    {
                        name: "Played Before",
                        artist: { "#text": "An Artist" },
                        date: { uts: "1700000000" },
                    },
                ],
            },
        })
        const tracks = await makeClient(fetch).getRecentTracks("listener", 2)

        expect(tracks[0]).toMatchObject({
            name: "Playing Now",
            artist: "An Artist",
            album: "An Album",
            // The largest image Last.fm offered
            imageUrl: "https://large.png",
            isNowPlaying: true,
        })
        expect(tracks[0].scrobbledAt).toBeUndefined()
        expect(tracks[1]).toMatchObject({
            name: "Played Before",
            scrobbledAt: 1_700_000_000,
            isNowPlaying: false,
        })
    })

    it("reads the top tracks response, including a single track", async () => {
        const fetch = respondWith({
            toptracks: {
                track: { name: "Only One", artist: { name: "An Artist" }, playcount: "42" },
            },
        })
        const tracks = await makeClient(fetch).getTopTracks("listener", "7day", 10)

        expect(tracks).toHaveLength(1)
        expect(tracks[0]).toMatchObject({ name: "Only One", artist: "An Artist", playCount: 42 })
    })

    it("knows whether it was built with credentials", () => {
        expect(new LastfmClient({ apiKey: "", apiSecret: "" }).hasCredentials).toBe(false)
        expect(new LastfmClient({ apiKey: "k", apiSecret: "s" }).hasCredentials).toBe(true)
    })
})
