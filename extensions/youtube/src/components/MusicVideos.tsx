import { useState } from "react"

import ChannelRow from "@/components/ChannelRow"
import ExternalLink from "@/components/ExternalLink"
import NowWatching from "@/components/NowWatching"
import VideoList from "@/components/VideoList"
import { getSearchUrl, type MusicVideoLookup, type YouTubeVideo } from "@/youtube/types"

export interface MusicVideosProps {
    readonly lookup: MusicVideoLookup
    readonly artist: string
    readonly title: string | null | undefined
}

/** What YouTube has for a song: its music video, or failing that the artist's videos */
export default function MusicVideos({ lookup, artist, title }: MusicVideosProps) {
    // What was picked to watch from a list, in place of the song's own video
    const [picked, setPicked] = useState<YouTubeVideo | null>(null)

    if (lookup.kind !== "artist") {
        const selected = picked ?? lookup.video
        const label = lookup.kind === "official" ? "Official video" : "Most viewed"
        return (
            <>
                <NowWatching
                    video={selected}
                    label={selected === lookup.video ? label : undefined}
                />
                {lookup.alternates.length > 0 && (
                    <VideoList
                        title="More of this song"
                        videos={[lookup.video, ...lookup.alternates]}
                        selected={selected}
                        onSelect={setPicked}
                    />
                )}
            </>
        )
    }

    if (lookup.channel === null && lookup.videos.length === 0) {
        return (
            <div className="flex flex-col gap-1 px-3 py-2 text-xs text-gray-500">
                <span>Nothing by {artist} was found on YouTube.</span>
                <ExternalLink href={getSearchUrl([artist, title].filter(Boolean).join(" "))}>
                    Search by hand
                </ExternalLink>
            </div>
        )
    }
    return (
        <>
            {title && (
                <div className="px-3 py-2 text-xs text-gray-500">
                    No video of “{title}” was found, so here is more from {artist}.
                </div>
            )}
            {lookup.channel && (
                <section className="flex flex-col">
                    <h2 className="px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        Official channel
                    </h2>
                    <ol className="flex flex-col">
                        <ChannelRow channel={lookup.channel} />
                    </ol>
                </section>
            )}
            {picked && <NowWatching video={picked} />}
            {lookup.videos.length > 0 && (
                <VideoList
                    title="Music videos"
                    videos={lookup.videos}
                    selected={picked}
                    onSelect={setPicked}
                />
            )}
        </>
    )
}
