import { CaretRightIcon, UserIcon } from "@phosphor-icons/react"
import classNames from "classnames"

import useNavigation from "@/hooks/navigationHook"
import { formatCount, joinDetails } from "@/utilities/format"
import type { YouTubeChannel } from "@/youtube/types"

export interface ChannelRowProps {
    readonly channel: YouTubeChannel
}

/** A channel, opening its profile */
export default function ChannelRow({ channel }: ChannelRowProps) {
    const navigation = useNavigation()
    return (
        <li className="w-full hover:bg-black/10">
            <button
                type="button"
                className="flex w-full min-w-0 items-center gap-3 px-3 py-2 text-start"
                onClick={() =>
                    navigation.push({ kind: "channel", id: channel.id, name: channel.title })
                }
            >
                <ChannelAvatar className="h-12 w-12" channel={channel} />
                <div className="flex min-w-0 flex-1 flex-col">
                    <div className="truncate text-sm font-bold">{channel.title}</div>
                    <div className="truncate text-xs text-gray-700">
                        {joinDetails(
                            channel.handle,
                            channel.subscriberCount !== undefined
                                ? formatCount(channel.subscriberCount, "subscriber")
                                : undefined,
                        ) || "Channel"}
                    </div>
                </div>
                <CaretRightIcon className="shrink-0 text-gray-500" aria-hidden />
            </button>
        </li>
    )
}

export interface ChannelAvatarProps {
    readonly channel: Pick<YouTubeChannel, "thumbnailUrl">
    readonly className?: string
}

export function ChannelAvatar({ channel, className }: ChannelAvatarProps) {
    return (
        <div
            className={classNames(
                "flex shrink-0 items-center justify-center overflow-clip rounded-full bg-indigo-100 text-indigo-300",
                className,
            )}
        >
            {channel.thumbnailUrl ? (
                <img className="h-full w-full object-cover" src={channel.thumbnailUrl} alt="" />
            ) : (
                <UserIcon aria-hidden />
            )}
        </div>
    )
}
