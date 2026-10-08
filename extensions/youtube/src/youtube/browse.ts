import { YouTubeError, type YouTubeClient } from "@/youtube/client"
import type { YouTubeChannel, YouTubeVideo } from "@/youtube/types"

const SEARCH_RESULTS = 25
const CHANNEL_UPLOADS = 50
const TRENDING_RESULTS = 25

/**
 * The ways a list of videos can be ordered. `relevance` is whatever order
 * YouTube returned them in, and `artist` is by the name of the channel.
 */
export type VideoOrder = "relevance" | "views" | "newest" | "title" | "artist"

export const VIDEO_ORDER_LABELS: Readonly<Record<VideoOrder, string>> = {
    relevance: "Relevance",
    views: "Most viewed",
    newest: "Newest",
    title: "Title",
    artist: "Artist",
}

const collator = new Intl.Collator(undefined, { sensitivity: "base", numeric: true })

/**
 * Order videos that have already been fetched. Sorting happens here rather
 * than by asking YouTube again, which would cost a whole search per change.
 */
export function sortVideos(
    videos: readonly YouTubeVideo[],
    order: VideoOrder,
): readonly YouTubeVideo[] {
    switch (order) {
        case "relevance":
            return videos
        case "views":
            return [...videos].sort((a, b) => b.viewCount - a.viewCount)
        case "newest":
            return [...videos].sort((a, b) =>
                (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
            )
        case "title":
            return [...videos].sort((a, b) => collator.compare(a.title, b.title))
        case "artist":
            return [...videos].sort(
                (a, b) =>
                    collator.compare(a.channelTitle, b.channelTitle) ||
                    collator.compare(a.title, b.title),
            )
    }
}

/** Put fetched details back into the order their ids were asked for */
function inOrder<Item extends { readonly id: string }>(
    ids: readonly string[],
    items: readonly Item[],
): readonly Item[] {
    const byId = new Map(items.map((item) => [item.id, item]))
    return ids.flatMap((id) => byId.get(id) ?? [])
}

export interface SearchResults {
    readonly channels: readonly YouTubeChannel[]
    readonly videos: readonly YouTubeVideo[]
}

/** Search YouTube for channels and videos, each most relevant first */
export async function searchYouTube(client: YouTubeClient, term: string): Promise<SearchResults> {
    const { channelIds, videoIds } = await client.search({
        query: term,
        types: ["channel", "video"],
        maxResults: SEARCH_RESULTS,
    })
    const [channels, videos] = await Promise.all([
        client.getChannels(channelIds),
        client.getVideos(videoIds),
    ])
    return { channels: inOrder(channelIds, channels), videos: inOrder(videoIds, videos) }
}

export interface ChannelProfile {
    readonly channel: YouTubeChannel
    /** The channel's most recent uploads, newest first */
    readonly videos: readonly YouTubeVideo[]
}

/** @returns `null` when there is no such channel. */
export async function readChannelProfile(
    client: YouTubeClient,
    channelId: string,
): Promise<ChannelProfile | null> {
    const [channel] = await client.getChannels([channelId])
    if (channel === undefined) {
        return null
    }
    const videoIds = channel.uploadsPlaylistId
        ? await client.getPlaylistVideoIds(channel.uploadsPlaylistId, CHANNEL_UPLOADS)
        : []
    return { channel, videos: inOrder(videoIds, await client.getVideos(videoIds)) }
}

/** The music videos being watched the most right now, where the viewer is if YouTube charts it */
export async function readTrendingMusic(
    client: YouTubeClient,
    regionCode: string | undefined,
): Promise<readonly YouTubeVideo[]> {
    try {
        return await client.getPopularMusicVideos({ regionCode, maxResults: TRENDING_RESULTS })
    } catch (error) {
        // Not every country has a music chart, the default one always exists
        if (regionCode && error instanceof YouTubeError && error.status < 500) {
            return await client.getPopularMusicVideos({ maxResults: TRENDING_RESULTS })
        }
        throw error
    }
}
