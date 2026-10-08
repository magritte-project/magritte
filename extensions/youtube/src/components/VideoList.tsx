import { useMemo, useState } from "react"

import OrderSelect from "@/components/OrderSelect"
import VideoRow from "@/components/VideoRow"
import useNavigation from "@/hooks/navigationHook"
import { sortVideos, type VideoOrder } from "@/youtube/browse"
import type { YouTubeVideo } from "@/youtube/types"

export interface VideoListProps {
    readonly title: string
    readonly videos: readonly YouTubeVideo[]
    /** The orders to offer, the first being the one the videos arrive in */
    readonly orders?: readonly VideoOrder[]
    /** The video to mark as the one being watched */
    readonly selected?: YouTubeVideo | null
    /** Called in place of opening the video's own page */
    readonly onSelect?: (video: YouTubeVideo) => void
}

export default function VideoList({ title, videos, orders, selected, onSelect }: VideoListProps) {
    const navigation = useNavigation()
    const [order, setOrder] = useState<VideoOrder | undefined>(orders?.[0])
    const sorted = useMemo(
        // The first order is how the videos arrived, so it is never sorted for
        () => (order === undefined || order === orders?.[0] ? videos : sortVideos(videos, order)),
        [videos, order, orders],
    )
    return (
        <section className="flex flex-col pb-2">
            <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                <h2 className="flex-1 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                    {title}
                </h2>
                {orders && order !== undefined && videos.length > 1 && (
                    <OrderSelect orders={orders} value={order} onChange={setOrder} />
                )}
            </div>
            <ol className="flex flex-col">
                {sorted.map((video) => (
                    <VideoRow
                        key={video.id}
                        video={video}
                        selected={video.id === selected?.id}
                        onClick={() =>
                            onSelect ? onSelect(video) : navigation.push({ kind: "video", video })
                        }
                    />
                ))}
            </ol>
        </section>
    )
}
