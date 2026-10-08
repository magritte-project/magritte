import type { PlayableItem } from "@magritte/sdk"
import { useQuery } from "@tanstack/react-query"

import { readMusicVideos } from "@/api/queries/musicVideos"
import useDebouncedValue from "@/hooks/debouncedValueHook"
import useHostNowPlaying from "@/hooks/hostNowPlayingHook"
import useYouTube from "@/hooks/youtubeHook"
import type { MusicVideoLookup } from "@/youtube/types"

/** Long enough that skipping through tracks does not spend a search on each */
const SETTLE_DELAY_MS = 1000

export type NowPlayingLookup =
    /** Nothing is playing */
    | { readonly status: "idle" }
    /** What is playing has no artist to look up */
    | { readonly status: "unmatchable"; readonly item: PlayableItem }
    | { readonly status: "pending"; readonly item: PlayableItem }
    | { readonly status: "error"; readonly item: PlayableItem; readonly error: unknown }
    | {
          readonly status: "ready"
          readonly item: PlayableItem
          readonly lookup: MusicVideoLookup
      }

/** What YouTube has for the song the host is playing */
export default function useNowPlayingLookup(): NowPlayingLookup {
    const { client, cache } = useYouTube()
    const nowPlaying = useHostNowPlaying()
    // A paused song still has a video, a stopped player does not
    const item = nowPlaying?.state === "stopped" ? null : (nowPlaying?.item ?? null)
    const settled = useDebouncedValue(item, SETTLE_DELAY_MS)
    const { data: lookup, error } = useQuery(
        readMusicVideos(client, cache, settled?.artist_name, settled?.title),
    )

    if (item === null) {
        return { status: "idle" }
    }
    if (!item.artist_name) {
        return { status: "unmatchable", item }
    }
    if (settled !== item) {
        return { status: "pending", item }
    }
    if (error) {
        return { status: "error", item, error }
    }
    return lookup === undefined ? { status: "pending", item } : { status: "ready", item, lookup }
}
