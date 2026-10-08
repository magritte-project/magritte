import { queryOptions, skipToken } from "@tanstack/react-query"

import { musicVideos } from "@/api/keys/musicVideos"
import type { LookupCache } from "@/youtube/cache"
import type { YouTubeClient } from "@/youtube/client"
import { findMusicVideos } from "@/youtube/lookup"
import { fold } from "@/youtube/match"

export function readMusicVideos(
    client: YouTubeClient,
    cache: LookupCache,
    artist: string | null | undefined,
    title: string | null | undefined,
) {
    const enabled = client.hasCredentials && Boolean(artist)
    return queryOptions({
        queryKey: musicVideos(artist ?? null, title ?? null),
        // A song's video does not change, and asking again spends the search quota
        staleTime: Infinity,
        retry: false,
        queryFn: enabled
            ? async () => {
                  const cacheKey = `${fold(artist)}|${fold(title)}`
                  const cached = cache.get(cacheKey)
                  if (cached !== null) {
                      return cached
                  }
                  const lookup = await findMusicVideos(client, artist!, title)
                  cache.set(cacheKey, lookup)
                  return lookup
              }
            : skipToken,
    })
}
