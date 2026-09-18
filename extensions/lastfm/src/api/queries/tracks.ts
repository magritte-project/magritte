import { queryOptions } from "@tanstack/react-query"

import { recentTracks, topTracks } from "@/api/keys/tracks"
import type { LastfmClient, TopTracksPeriod } from "@/lastfm/client"

export function readRecentTracks(client: LastfmClient, user: string | null, limit = 25) {
    return queryOptions({
        queryKey: recentTracks(user, limit),
        // Scrobbles are submitted by this extension, so they go stale quickly
        staleTime: 30_000,
        enabled: user !== null,
        queryFn: async () => {
            if (user === null) {
                return []
            }
            return await client.getRecentTracks(user, limit)
        },
    })
}

export function getTopTracksPeriodLabel(period: TopTracksPeriod): string {
    switch (period) {
        case "7day":
            return "This Week"
        case "1month":
            return "This Month"
    }
}

export function readTopTracks(
    client: LastfmClient,
    user: string | null,
    period: TopTracksPeriod,
    limit = 25,
) {
    return queryOptions({
        queryKey: topTracks(user, period, limit),
        // Charts move slowly, so they are worth holding on to across views
        staleTime: 5 * 60_000,
        enabled: user !== null,
        queryFn: async () => {
            if (user === null) {
                return []
            }
            return await client.getTopTracks(user, period, limit)
        },
    })
}
