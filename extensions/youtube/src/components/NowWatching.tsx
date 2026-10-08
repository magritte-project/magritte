import { useCallback } from "react"

import ExternalLink from "@/components/ExternalLink"
import VideoPlayer from "@/components/VideoPlayer"
import useExtensionHost from "@/hooks/extensionHostHook"
import useNavigation from "@/hooks/navigationHook"
import { formatCount, formatDate, joinDetails } from "@/utilities/format"
import { getVideoUrl, type YouTubeVideo } from "@/youtube/types"

export interface NowWatchingProps {
    readonly video: YouTubeVideo
    /** Says how the video was chosen, e.g. `Official video` */
    readonly label?: string
}

/** A video and what it is, pausing the host's own playback while it plays */
export default function NowWatching({ video, label }: NowWatchingProps) {
    const extensionHost = useExtensionHost()
    const navigation = useNavigation()
    const pauseHost = useCallback(() => {
        extensionHost
            .player()
            .then((player) => player.pause())
            .catch((error) => console.warn("*** Could not pause the host player", error))
    }, [extensionHost])
    return (
        <div className="flex flex-col">
            <VideoPlayer video={video} onPlay={pauseHost} />
            <div className="flex flex-col gap-0.5 px-3 pt-2 pb-1">
                <div className="text-sm leading-tight font-bold">{video.title}</div>
                <div className="text-xs text-gray-700">
                    {joinDetails(
                        label,
                        formatCount(video.viewCount, "view"),
                        formatDate(video.publishedAt),
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 text-xs text-gray-700">
                    <button
                        type="button"
                        className="min-w-0 truncate font-semibold hover:underline"
                        onClick={() =>
                            navigation.push({
                                kind: "channel",
                                id: video.channelId,
                                name: video.channelTitle,
                            })
                        }
                    >
                        {video.channelTitle || "Channel"}
                    </button>
                    <ExternalLink href={getVideoUrl(video)}>Open on YouTube</ExternalLink>
                </div>
            </div>
        </div>
    )
}
