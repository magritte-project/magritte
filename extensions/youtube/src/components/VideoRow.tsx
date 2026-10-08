import classNames from "classnames"

import { formatCount, formatDuration, joinDetails } from "@/utilities/format"
import type { YouTubeVideo } from "@/youtube/types"

export interface VideoRowProps {
    readonly video: YouTubeVideo
    readonly selected?: boolean
    readonly onClick?: () => void
}

export default function VideoRow({ video, selected = false, onClick }: VideoRowProps) {
    return (
        <li className={classNames("w-full hover:bg-black/10", selected && "bg-black/5")}>
            <button
                type="button"
                className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-start"
                aria-current={selected}
                onClick={onClick}
            >
                <div className="relative aspect-video w-24 shrink-0 overflow-clip rounded-md bg-indigo-100">
                    {video.thumbnailUrl && (
                        <img
                            className="h-full w-full object-cover"
                            src={video.thumbnailUrl}
                            alt=""
                            loading="lazy"
                        />
                    )}
                    {video.durationSec !== undefined && (
                        <div className="absolute right-0.5 bottom-0.5 rounded-sm bg-black/80 px-1 text-[0.625rem] font-medium text-white">
                            {formatDuration(video.durationSec)}
                        </div>
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="line-clamp-2 text-sm leading-tight font-bold">
                        {video.title}
                    </div>
                    <div className="truncate text-xs text-gray-700">
                        {joinDetails(video.channelTitle, formatCount(video.viewCount, "view"))}
                    </div>
                </div>
            </button>
        </li>
    )
}
