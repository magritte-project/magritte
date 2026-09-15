import { queryOptions } from "@tanstack/react-query"

import { recent } from "@/api/keys/recent"
import type { UnknownMusicResource } from "@/musickit/models/base"
import { isCollectionResource } from "@/musickit/models/collection"
import { fetchAllPages } from "@/musickit/pagination"

export type RecentKind = "played" | "added"

export function getRecentTitle(kind: RecentKind): string {
    switch (kind) {
        case "played":
            return "Recently Played"
        case "added":
            return "Recently Added"
    }
}

export function readRecent(musicKit: MusicKit.Instance, kind: RecentKind) {
    return queryOptions({
        queryKey: recent(kind),
        queryFn: async () => {
            // Page sizes are the maximums allowed by each endpoint
            const items =
                kind === "played"
                    ? await fetchAllPages<UnknownMusicResource>(musicKit, "/v1/me/recent/played", {
                          queryParameters: { limit: "10" },
                          maxItems: 30,
                      })
                    : await fetchAllPages<UnknownMusicResource>(
                          musicKit,
                          "/v1/me/library/recently-added",
                          {
                              queryParameters: { limit: "25" },
                              maxItems: 50,
                          },
                      )
            // Stations and other non-browsable items are skipped
            return items.filter(isCollectionResource)
        },
    })
}
