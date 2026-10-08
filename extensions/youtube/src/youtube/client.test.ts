import { describe, expect, it, vi } from "vitest"

import { parseDuration, YouTubeClient, YouTubeError, YouTubeNetworkError } from "@/youtube/client"

type FetchMock = ReturnType<typeof respondWith>

/** A `fetch` which always answers with the same JSON payload */
function respondWith(payload: unknown, { status = 200 } = {}) {
    return vi.fn(
        async (_input: RequestInfo | URL, _init?: RequestInit) =>
            new Response(JSON.stringify(payload), { status }),
    )
}

function makeClient(fetch: FetchMock) {
    return new YouTubeClient({ apiKey: "the-key", fetch: fetch as typeof globalThis.fetch })
}

function requestUrl(fetch: FetchMock, call = 0): URL {
    return new URL(String(fetch.mock.calls[call][0]))
}

describe("parseDuration", () => {
    it("reads ISO 8601 durations", () => {
        expect(parseDuration("PT4M13S")).toBe(253)
        expect(parseDuration("PT1H2M3S")).toBe(3723)
        expect(parseDuration("PT45S")).toBe(45)
        expect(parseDuration("P1DT1S")).toBe(86_401)
    })

    it("is undefined for anything else", () => {
        expect(parseDuration("4:13")).toBeUndefined()
        expect(parseDuration(undefined)).toBeUndefined()
    })
})

describe("YouTubeClient", () => {
    it("knows whether it has a key", () => {
        expect(makeClient(respondWith({})).hasCredentials).toBe(true)
        expect(
            new YouTubeClient({ apiKey: "", fetch: respondWith({}) as any }).hasCredentials,
        ).toBe(false)
    })

    it("searches for ids of the requested types", async () => {
        const fetch = respondWith({
            items: [
                { id: { kind: "youtube#channel", channelId: "c1" } },
                { id: { kind: "youtube#video", videoId: "v1" } },
                { id: { kind: "youtube#video", videoId: "v2" } },
            ],
        })
        const results = await makeClient(fetch).search({
            query: "Nirvana",
            types: ["channel", "video"],
            maxResults: 25,
        })

        expect(results).toEqual({ videoIds: ["v1", "v2"], channelIds: ["c1"] })
        const url = requestUrl(fetch)
        expect(url.origin + url.pathname).toBe("https://www.googleapis.com/youtube/v3/search")
        expect(url.searchParams.get("q")).toBe("Nirvana")
        expect(url.searchParams.get("type")).toBe("channel,video")
        expect(url.searchParams.get("maxResults")).toBe("25")
        expect(url.searchParams.get("key")).toBe("the-key")
        expect(fetch.mock.calls[0][1]?.method).toBe("GET")
    })

    it("reads video details", async () => {
        const fetch = respondWith({
            items: [
                {
                    id: "v1",
                    snippet: {
                        title: "Nirvana - Lithium (Official Music Video)",
                        channelId: "c1",
                        channelTitle: "NirvanaVEVO",
                        thumbnails: {
                            default: { url: "default.jpg" },
                            medium: { url: "medium.jpg" },
                        },
                    },
                    contentDetails: { duration: "PT4M17S" },
                    statistics: { viewCount: "123456789" },
                    status: { embeddable: false },
                },
                { id: "v2", snippet: { title: "Bare", channelId: "c2" } },
                { id: "broken" },
            ],
        })
        const videos = await makeClient(fetch).getVideos(["v1", "v2", "broken"])

        expect(videos).toEqual([
            {
                id: "v1",
                title: "Nirvana - Lithium (Official Music Video)",
                channelId: "c1",
                channelTitle: "NirvanaVEVO",
                thumbnailUrl: "medium.jpg",
                durationSec: 257,
                viewCount: 123_456_789,
                embeddable: false,
            },
            {
                id: "v2",
                title: "Bare",
                channelId: "c2",
                channelTitle: "",
                thumbnailUrl: undefined,
                durationSec: undefined,
                viewCount: 0,
                embeddable: true,
            },
        ])
        const url = requestUrl(fetch)
        expect(url.pathname).toBe("/youtube/v3/videos")
        expect(url.searchParams.get("id")).toBe("v1,v2,broken")
        expect(url.searchParams.get("part")).toBe("snippet,contentDetails,statistics,status")
    })

    it("reads channel details, respecting hidden subscriber counts", async () => {
        const fetch = respondWith({
            items: [
                {
                    id: "c1",
                    snippet: { title: "Nirvana", thumbnails: { high: { url: "high.jpg" } } },
                    statistics: { subscriberCount: "5000000", hiddenSubscriberCount: false },
                },
                {
                    id: "c2",
                    snippet: { title: "Shy" },
                    statistics: { subscriberCount: "0", hiddenSubscriberCount: true },
                },
            ],
        })
        expect(await makeClient(fetch).getChannels(["c1", "c2"])).toEqual([
            { id: "c1", title: "Nirvana", thumbnailUrl: "high.jpg", subscriberCount: 5_000_000 },
            { id: "c2", title: "Shy", thumbnailUrl: undefined, subscriberCount: undefined },
        ])
        expect(requestUrl(fetch).pathname).toBe("/youtube/v3/channels")
    })

    it("asks for nothing when given no ids, and splits long lists", async () => {
        const fetch = respondWith({ items: [] })
        const client = makeClient(fetch)
        expect(await client.getVideos([])).toEqual([])
        expect(fetch).not.toHaveBeenCalled()

        await client.getChannels(Array.from({ length: 51 }, (_, index) => `c${index}`))
        expect(fetch).toHaveBeenCalledTimes(2)
        expect(requestUrl(fetch, 0).searchParams.get("id")?.split(",")).toHaveLength(50)
        expect(requestUrl(fetch, 1).searchParams.get("id")).toBe("c50")
    })

    it("reports when the quota has run out", async () => {
        const fetch = respondWith(
            {
                error: {
                    code: 403,
                    message:
                        "The request cannot be completed because you have exceeded your quota.",
                    errors: [{ reason: "quotaExceeded", domain: "youtube.quota" }],
                },
            },
            { status: 403 },
        )
        const error = await makeClient(fetch)
            .search({ query: "q", types: ["video"], maxResults: 1 })
            .catch((error) => error)

        expect(error).toBeInstanceOf(YouTubeError)
        expect(error.status).toBe(403)
        expect(error.isQuotaExceeded).toBe(true)
        expect(error.message).toContain("exceeded your quota")
    })

    it("reports other errors without mistaking them for the quota", async () => {
        const fetch = respondWith(
            {
                error: {
                    code: 400,
                    message: "API key not valid.",
                    errors: [{ reason: "badRequest" }],
                },
            },
            { status: 400 },
        )
        const error = await makeClient(fetch)
            .getVideos(["v1"])
            .catch((error) => error)
        expect(error).toBeInstanceOf(YouTubeError)
        expect(error.isQuotaExceeded).toBe(false)
    })

    it("wraps network failures", async () => {
        const fetch = vi.fn(async () => {
            throw new TypeError("offline")
        })
        await expect(
            makeClient(fetch as unknown as FetchMock).getVideos(["v1"]),
        ).rejects.toBeInstanceOf(YouTubeNetworkError)
    })
})

describe("YouTubeClient browsing", () => {
    it("reads the music chart for a country", async () => {
        const fetch = respondWith({
            items: [
                {
                    id: "v1",
                    snippet: { title: "Hit", channelId: "c1", publishedAt: "2026-01-02T03:04:05Z" },
                },
            ],
        })
        const videos = await makeClient(fetch).getPopularMusicVideos({
            regionCode: "GB",
            maxResults: 25,
        })

        expect(videos[0]).toMatchObject({ id: "v1", publishedAt: "2026-01-02T03:04:05Z" })
        const parameters = requestUrl(fetch).searchParams
        expect(requestUrl(fetch).pathname).toBe("/youtube/v3/videos")
        expect(parameters.get("chart")).toBe("mostPopular")
        expect(parameters.get("videoCategoryId")).toBe("10")
        expect(parameters.get("regionCode")).toBe("GB")
    })

    it("leaves the country out when there is none", async () => {
        const fetch = respondWith({ items: [] })
        await makeClient(fetch).getPopularMusicVideos({ maxResults: 5 })
        expect(requestUrl(fetch).searchParams.has("regionCode")).toBe(false)
    })

    it("reads the ids of a playlist's videos", async () => {
        const fetch = respondWith({
            items: [
                { contentDetails: { videoId: "v1" } },
                { contentDetails: { videoId: "v2" } },
                {},
            ],
        })
        expect(await makeClient(fetch).getPlaylistVideoIds("UU1", 50)).toEqual(["v1", "v2"])
        const url = requestUrl(fetch)
        expect(url.pathname).toBe("/youtube/v3/playlistItems")
        expect(url.searchParams.get("playlistId")).toBe("UU1")
        expect(url.searchParams.get("maxResults")).toBe("50")
    })

    it("treats a missing playlist as empty", async () => {
        const fetch = respondWith(
            {
                error: {
                    code: 404,
                    message: "Not found",
                    errors: [{ reason: "playlistNotFound" }],
                },
            },
            { status: 404 },
        )
        expect(await makeClient(fetch).getPlaylistVideoIds("UU1", 50)).toEqual([])
    })

    it("reads what a channel's profile shows", async () => {
        const fetch = respondWith({
            items: [
                {
                    id: "c1",
                    snippet: { title: "Nirvana", customUrl: "@nirvana", description: "A band." },
                    statistics: { subscriberCount: "5", videoCount: "120" },
                    contentDetails: { relatedPlaylists: { uploads: "UU1" } },
                },
            ],
        })
        expect((await makeClient(fetch).getChannels(["c1"]))[0]).toMatchObject({
            handle: "@nirvana",
            description: "A band.",
            videoCount: 120,
            uploadsPlaylistId: "UU1",
        })
        expect(requestUrl(fetch).searchParams.get("part")).toBe("snippet,statistics,contentDetails")
    })
})
