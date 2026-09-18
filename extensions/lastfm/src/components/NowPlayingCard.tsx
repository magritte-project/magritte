import { BroadcastIcon, PauseCircleIcon, WarningCircleIcon } from "@phosphor-icons/react"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import useLastfmAccount from "@/hooks/accountHook"
import useHostNowPlaying from "@/hooks/hostNowPlayingHook"
import { joinDetails } from "@/utilities/format"

interface Status {
    readonly icon: typeof BroadcastIcon
    readonly label: string
    readonly className: string
}

const scrobblingStatus: Status = {
    icon: BroadcastIcon,
    label: "Scrobbling",
    className: "text-[#b90000]",
}

const pausedStatus: Status = {
    icon: PauseCircleIcon,
    label: "Scrobbling is off",
    className: "text-gray-500",
}

const incompleteStatus: Status = {
    icon: WarningCircleIcon,
    label: "Missing artist or title, so it will not be scrobbled",
    className: "text-gray-500",
}

export default function NowPlayingCard() {
    const nowPlaying = useHostNowPlaying()
    const { session, isScrobblingEnabled } = useLastfmAccount()

    const item = nowPlaying?.item ?? null
    if (item === null || nowPlaying?.state === "stopped") {
        return (
            <div className="px-3 py-4 text-center text-sm text-gray-500">
                Play something and it will show up here.
            </div>
        )
    }

    const canScrobble = Boolean(item.artist_name?.trim() && item.title?.trim())
    const isActive = session !== null && isScrobblingEnabled
    const status = !canScrobble
        ? incompleteStatus
        : !isActive
          ? pausedStatus
          : nowPlaying?.state === "paused"
            ? { ...scrobblingStatus, label: "Paused", className: "text-gray-500" }
            : scrobblingStatus
    const StatusIcon = status.icon
    return (
        <div className="flex items-center gap-3 px-3 py-3">
            <ArtworkImage
                className="h-14 w-14 shrink-0"
                imageUrl={item.artworks?.[0]?.image_url}
                itemTitle={item.title}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="truncate text-sm font-bold">{item.title ?? "--"}</div>
                <div className="truncate text-xs text-gray-700">
                    {joinDetails(item.artist_name, item.album_title)}
                </div>
                <div className={`mt-0.5 flex items-center gap-1 text-xs ${status.className}`}>
                    <StatusIcon className="shrink-0" aria-hidden />
                    <span className="truncate">{status.label}</span>
                </div>
            </div>
        </div>
    )
}
