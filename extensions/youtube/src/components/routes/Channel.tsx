import { useQuery } from "@tanstack/react-query"

import { readChannel } from "@/api/queries/browse"
import { ChannelAvatar } from "@/components/ChannelRow"
import ExternalLink from "@/components/ExternalLink"
import SectionState from "@/components/structure/SectionState"
import YouTubeErrorState from "@/components/structure/YouTubeErrorState"
import VideoList from "@/components/VideoList"
import useYouTube from "@/hooks/youtubeHook"
import { formatCount, joinDetails } from "@/utilities/format"
import { getChannelUrl } from "@/youtube/types"

/** Uploads arrive newest first */
const ORDERS = ["newest", "views", "title"] as const

export interface ChannelProps {
    readonly id: string
}

/** A channel's profile: who they are and what they have uploaded */
export default function Channel({ id }: ChannelProps) {
    const { client } = useYouTube()
    const channelQuery = useQuery(readChannel(client, id))

    if (channelQuery.isError) {
        return <YouTubeErrorState error={channelQuery.error} />
    }
    if (channelQuery.isPending) {
        return <SectionState status="pending" />
    }
    if (channelQuery.data === null) {
        return <SectionState status="empty" message="This channel is no longer on YouTube." />
    }

    const { channel, videos } = channelQuery.data
    return (
        <>
            <div className="flex flex-col items-center gap-2 p-3 text-center">
                <ChannelAvatar className="h-20 w-20 text-2xl" channel={channel} />
                <div className="flex flex-col">
                    <div className="text-lg leading-tight font-bold">{channel.title || "--"}</div>
                    <div className="text-xs text-gray-700">
                        {joinDetails(
                            channel.handle,
                            channel.subscriberCount !== undefined
                                ? formatCount(channel.subscriberCount, "subscriber")
                                : undefined,
                            channel.videoCount !== undefined
                                ? formatCount(channel.videoCount, "video")
                                : undefined,
                        )}
                    </div>
                </div>
                {channel.description && (
                    <p className="line-clamp-3 text-xs whitespace-pre-line text-gray-700">
                        {channel.description}
                    </p>
                )}
                <ExternalLink className="text-xs text-gray-700" href={getChannelUrl(channel.id)}>
                    Open on YouTube
                </ExternalLink>
            </div>
            {videos.length > 0 ? (
                <VideoList title="Uploads" videos={videos} orders={ORDERS} />
            ) : (
                <SectionState status="empty" message="This channel has no public videos." />
            )}
        </>
    )
}
