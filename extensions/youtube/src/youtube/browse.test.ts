import { describe, expect, it, vi } from "vitest"

import { readChannelProfile, readTrendingMusic, searchYouTube, sortVideos } from "@/youtube/browse"
import { YouTubeError, type YouTubeClient } from "@/youtube/client"
import type { YouTubeChannel, YouTubeVideo } from "@/youtube/types"

function video(id: string, fields: Partial<YouTubeVideo> = {}): YouTubeVideo {
    return {
        id,
        title: id,
        channelId: "c1",
        channelTitle: "Channel",
        viewCount: 0,
        embeddable: true,
        ...fields,
    }
}

function makeClient(overrides: Partial<Record<keyof YouTubeClient, unknown>>) {
    return overrides as unknown as YouTubeClient
}

describe("sortVideos", () => {
    const videos = [
        video("a", {
            title: "Zebra",
            channelTitle: "beta",
            viewCount: 5,
            publishedAt: "2020-01-01T00:00:00Z",
        }),
        video("b", {
            title: "apple",
            channelTitle: "Alpha",
            viewCount: 50,
            publishedAt: "2024-01-01T00:00:00Z",
        }),
        video("c", { title: "Mango", channelTitle: "alpha", viewCount: 20 }),
    ]
    const ids = (order: Parameters<typeof sortVideos>[1]) =>
        sortVideos(videos, order).map((video) => video.id)

    it("leaves relevance as it arrived", () => {
        expect(sortVideos(videos, "relevance")).toBe(videos)
    })

    it("orders by views, date, title and artist", () => {
        expect(ids("views")).toEqual(["b", "c", "a"])
        // Videos without a date sort last
        expect(ids("newest")).toEqual(["b", "a", "c"])
        expect(ids("title")).toEqual(["b", "c", "a"])
        // Within a channel, by title
        expect(ids("artist")).toEqual(["b", "c", "a"])
    })

    it("does not reorder the list it was given", () => {
        sortVideos(videos, "views")
        expect(videos.map((video) => video.id)).toEqual(["a", "b", "c"])
    })
})

describe("searchYouTube", () => {
    it("returns channels and videos in the order they were found", async () => {
        const search = vi.fn(async () => ({
            channelIds: ["c2", "c1"],
            videoIds: ["v2", "v1", "gone"],
        }))
        const client = makeClient({
            search,
            getChannels: async (): Promise<YouTubeChannel[]> => [
                { id: "c1", title: "One" },
                { id: "c2", title: "Two" },
            ],
            getVideos: async () => [video("v1"), video("v2")],
        })
        const results = await searchYouTube(client, "nirvana")

        expect(results.channels.map((channel) => channel.id)).toEqual(["c2", "c1"])
        expect(results.videos.map((video) => video.id)).toEqual(["v2", "v1"])
        expect(search).toHaveBeenCalledTimes(1)
        expect(search).toHaveBeenCalledWith(
            expect.objectContaining({ query: "nirvana", types: ["channel", "video"] }),
        )
    })
})

describe("readChannelProfile", () => {
    it("reads a channel and its uploads, newest first", async () => {
        const getPlaylistVideoIds = vi.fn(async () => ["new", "old"])
        const client = makeClient({
            getChannels: async () => [{ id: "c1", title: "Nirvana", uploadsPlaylistId: "UU1" }],
            getPlaylistVideoIds,
            getVideos: async () => [video("old"), video("new")],
        })
        const profile = await readChannelProfile(client, "c1")

        expect(profile?.channel.title).toBe("Nirvana")
        expect(profile?.videos.map((video) => video.id)).toEqual(["new", "old"])
        expect(getPlaylistVideoIds).toHaveBeenCalledWith("UU1", 50)
    })

    it("is null for a channel that does not exist", async () => {
        expect(
            await readChannelProfile(makeClient({ getChannels: async () => [] }), "c1"),
        ).toBeNull()
    })

    it("has no videos for a channel without an uploads playlist", async () => {
        const client = makeClient({
            getChannels: async () => [{ id: "c1", title: "Empty" }],
            getVideos: async () => [],
        })
        expect((await readChannelProfile(client, "c1"))?.videos).toEqual([])
    })
})

describe("readTrendingMusic", () => {
    it("charts the viewer's country", async () => {
        const getPopularMusicVideos = vi.fn(async () => [video("v1")])
        const videos = await readTrendingMusic(makeClient({ getPopularMusicVideos }), "GB")
        expect(videos.map((video) => video.id)).toEqual(["v1"])
        expect(getPopularMusicVideos).toHaveBeenCalledWith(
            expect.objectContaining({ regionCode: "GB" }),
        )
    })

    it("falls back to the default chart when the country has none", async () => {
        const getPopularMusicVideos = vi
            .fn()
            .mockRejectedValueOnce(new YouTubeError(400, "videoChartNotFound", "No chart"))
            .mockResolvedValueOnce([video("v1")])
        const videos = await readTrendingMusic(makeClient({ getPopularMusicVideos }), "XX")

        expect(videos).toHaveLength(1)
        expect(getPopularMusicVideos.mock.calls[1][0].regionCode).toBeUndefined()
    })

    it("does not hide other failures", async () => {
        const quota = new YouTubeError(503, undefined, "Down")
        const getPopularMusicVideos = vi.fn().mockRejectedValue(quota)
        await expect(readTrendingMusic(makeClient({ getPopularMusicVideos }), "GB")).rejects.toBe(
            quota,
        )
        await expect(
            readTrendingMusic(makeClient({ getPopularMusicVideos }), undefined),
        ).rejects.toBe(quota)
    })
})
