import { CaretRightIcon, CircleNotchIcon } from "@phosphor-icons/react"

import YouTubeErrorState from "@/components/structure/YouTubeErrorState"
import useNavigation from "@/hooks/navigationHook"
import useNowPlayingLookup from "@/hooks/nowPlayingLookupHook"
import { joinDetails } from "@/utilities/format"
import type { MusicVideoLookup } from "@/youtube/types"

function getHeadline(lookup: MusicVideoLookup, artist: string): string {
    switch (lookup.kind) {
        case "official":
            return "Watch the official video"
        case "popular":
            return "Watch the most viewed video"
        case "artist":
            return `Watch more from ${artist}`
    }
}

function getThumbnailUrl(lookup: MusicVideoLookup): string | undefined {
    return lookup.kind === "artist"
        ? (lookup.videos[0]?.thumbnailUrl ?? lookup.channel?.thumbnailUrl)
        : lookup.video.thumbnailUrl
}

/**
 * Offers the music video of whatever the host is playing, opening the page
 * that has it. Shows nothing while nothing is playing or nothing was found.
 */
export default function NowPlayingBanner() {
    const navigation = useNavigation()
    const nowPlaying = useNowPlayingLookup()
    if (nowPlaying.status === "idle" || nowPlaying.status === "unmatchable") {
        return null
    }
    if (nowPlaying.status === "error") {
        return <YouTubeErrorState error={nowPlaying.error} />
    }

    const { item } = nowPlaying
    const lookup = nowPlaying.status === "ready" ? nowPlaying.lookup : null
    if (lookup?.kind === "artist" && lookup.channel === null && lookup.videos.length === 0) {
        return null
    }
    const thumbnailUrl = lookup && getThumbnailUrl(lookup)
    return (
        <div className="p-2">
            <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg bg-[#3b3b6d] p-2 text-start text-white hover:bg-[#2c2c52] disabled:hover:bg-[#3b3b6d]"
                disabled={lookup === null}
                onClick={() => navigation.push({ kind: "nowPlaying" })}
            >
                <div className="flex aspect-video w-24 shrink-0 items-center justify-center overflow-clip rounded-md bg-black/30">
                    {thumbnailUrl ? (
                        <img className="h-full w-full object-cover" src={thumbnailUrl} alt="" />
                    ) : (
                        lookup === null && <CircleNotchIcon className="animate-spin" aria-hidden />
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="text-[0.625rem] font-semibold tracking-wide text-white/70 uppercase">
                        Now playing
                    </div>
                    <div className="truncate text-sm font-bold">
                        {lookup
                            ? getHeadline(lookup, item.artist_name ?? "this artist")
                            : "Looking for the music video…"}
                    </div>
                    <div className="truncate text-xs text-white/80">
                        {joinDetails(item.title, item.artist_name)}
                    </div>
                </div>
                {lookup && <CaretRightIcon className="shrink-0" aria-hidden />}
            </button>
        </div>
    )
}
