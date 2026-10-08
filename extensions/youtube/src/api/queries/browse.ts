import { queryOptions, skipToken } from "@tanstack/react-query"

import { channel } from "@/api/keys/channel"
import { search } from "@/api/keys/search"
import { trending } from "@/api/keys/trending"
import { readChannelProfile, readTrendingMusic, searchYouTube } from "@/youtube/browse"
import type { YouTubeClient } from "@/youtube/client"

/** Asking again spends quota, and nothing here moves fast enough to be worth it */
const browseOptions = {
    staleTime: Infinity,
    retry: false,
} as const

export function searchVideos(client: YouTubeClient, term: string) {
    return queryOptions({
        queryKey: search(term),
        ...browseOptions,
        queryFn: term ? async () => await searchYouTube(client, term) : skipToken,
    })
}

export function readChannel(client: YouTubeClient, id: string) {
    return queryOptions({
        queryKey: channel(id),
        ...browseOptions,
        queryFn: async () => await readChannelProfile(client, id),
    })
}

export function readTrending(client: YouTubeClient, regionCode: string | undefined) {
    return queryOptions({
        queryKey: trending(regionCode ?? null),
        ...browseOptions,
        queryFn: async () => await readTrendingMusic(client, regionCode),
    })
}
