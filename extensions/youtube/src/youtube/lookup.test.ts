import { describe, expect, it, vi } from "vitest"

import type { YouTubeClient, YouTubeSearchOptions } from "@/youtube/client"
import { findMusicVideos } from "@/youtube/lookup"
import type { YouTubeChannel, YouTubeVideo } from "@/youtube/types"

function video(id: string, title: string, channelTitle: string, viewCount = 0): YouTubeVideo {
    return {
        id,
        title,
        channelId: `channel:${channelTitle}`,
        channelTitle,
        viewCount,
        embeddable: true,
    }
}

interface FakeYouTube {
    /** The ids each search answers with, by query */
    readonly searches: Record<string, { videoIds?: string[]; channelIds?: string[] }>
    readonly videos?: readonly YouTubeVideo[]
    readonly channels?: readonly YouTubeChannel[]
}

function makeClient({ searches, videos = [], channels = [] }: FakeYouTube) {
    const client = {
        search: vi.fn(async ({ query }: YouTubeSearchOptions) => ({
            videoIds: searches[query]?.videoIds ?? [],
            channelIds: searches[query]?.channelIds ?? [],
        })),
        getVideos: vi.fn(async (ids: readonly string[]) =>
            videos.filter((video) => ids.includes(video.id)),
        ),
        getChannels: vi.fn(async (ids: readonly string[]) =>
            channels.filter((channel) => ids.includes(channel.id)),
        ),
    }
    return client as typeof client & YouTubeClient
}

describe("findMusicVideos", () => {
    it("returns the official video with a single search", async () => {
        const official = video("v1", "Nirvana - Lithium (Official Music Video)", "NirvanaVEVO", 5)
        const client = makeClient({
            searches: { "Nirvana Lithium": { videoIds: ["v1", "v2"] } },
            videos: [official, video("v2", "Nirvana - Lithium", "Some Fan", 900)],
        })
        const lookup = await findMusicVideos(client, "Nirvana", "Lithium")

        expect(lookup).toMatchObject({ kind: "official", video: official })
        expect(client.search).toHaveBeenCalledTimes(1)
        expect(client.search).toHaveBeenCalledWith(
            expect.objectContaining({ query: "Nirvana Lithium", types: ["video"] }),
        )
        expect(client.getChannels).not.toHaveBeenCalled()
    })

    it("returns the most viewed video when there is no official one", async () => {
        const client = makeClient({
            searches: { "Obscure Band Deep Cut": { videoIds: ["v1", "v2"] } },
            videos: [
                video("v1", "Obscure Band - Deep Cut", "Uploader A", 5),
                video("v2", "Obscure Band - Deep Cut (rare)", "Uploader B", 900),
            ],
        })
        const lookup = await findMusicVideos(client, "Obscure Band", "Deep Cut")
        expect(lookup).toMatchObject({ kind: "popular", video: { id: "v2" } })
    })

    it("falls back to the artist's channel and videos when the song has none", async () => {
        const channel = { id: "channel:Nirvana", title: "Nirvana", subscriberCount: 5_000_000 }
        const client = makeClient({
            searches: {
                "Nirvana Deep Cut": { videoIds: ["other"] },
                Nirvana: { videoIds: ["v1", "v2"], channelIds: ["channel:Nirvana Fans"] },
            },
            videos: [
                video("other", "Something else entirely", "Somebody"),
                video("v1", "Nirvana - Rare Footage", "Some Fan", 900),
                video("v2", "Come As You Are", "Nirvana", 5),
            ],
            channels: [channel, { id: "channel:Nirvana Fans", title: "Nirvana Fans" }],
        })
        const lookup = await findMusicVideos(client, "Nirvana", "Deep Cut")

        expect(lookup).toMatchObject({
            kind: "artist",
            channel,
            videos: [{ id: "v2" }, { id: "v1" }],
        })
        expect(client.search).toHaveBeenLastCalledWith(
            expect.objectContaining({ query: "Nirvana", types: ["channel", "video"] }),
        )
        // The official channel was not a search result, it came from one of the videos
        expect(client.getChannels.mock.calls[0][0]).toEqual(
            expect.arrayContaining(["channel:Nirvana Fans", "channel:Nirvana", "channel:Some Fan"]),
        )
    })

    it("goes straight to the artist when the song has no title", async () => {
        const client = makeClient({ searches: {} })
        expect(await findMusicVideos(client, "Nirvana", null)).toEqual({
            kind: "artist",
            channel: null,
            videos: [],
        })
        expect(client.search).toHaveBeenCalledTimes(1)
    })
})
