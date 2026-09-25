import type { PlayableItem } from "@magritte/sdk"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import { formatYear, joinDetails } from "@/utilities/format"

export interface NowPlayingHeaderProps {
    readonly item: PlayableItem
}

/** What is playing, straight from the host, before anything has been looked up */
export default function NowPlayingHeader({ item }: NowPlayingHeaderProps) {
    return (
        <div className="flex items-center gap-3 px-3 py-3">
            <ArtworkImage
                className="h-16 w-16 shrink-0"
                imageUrl={item.artworks?.[0]?.image_url}
                itemTitle={item.title}
            />
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="text-base font-bold leading-tight">{item.title ?? "--"}</div>
                <div className="truncate text-sm text-gray-700">
                    {joinDetails(item.artist_name, item.album_title)}
                </div>
                <div className="mt-0.5 truncate text-xs text-gray-500">
                    {joinDetails(formatYear(item.release_date), item.genre)}
                </div>
            </div>
        </div>
    )
}
