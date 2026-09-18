import type { ReactNode } from "react"

import ArtworkImage from "@/components/reusable/ArtworkImage"
import ItemRow from "@/components/reusable/ItemRow"
import type { LastfmTrack } from "@/lastfm/client"

export interface TrackRowProps {
    readonly track: LastfmTrack
    readonly subtitle?: string | null
    readonly accessory?: ReactNode
}

export default function TrackRow({ track, subtitle, accessory }: TrackRowProps) {
    return (
        <ItemRow
            leading={
                <ArtworkImage
                    className="h-10 w-10 shrink-0"
                    imageUrl={track.imageUrl}
                    itemTitle={track.name}
                />
            }
            title={track.name}
            subtitle={subtitle ?? track.artist}
            accessory={accessory}
            onClick={track.url ? () => globalThis.open(track.url, "_blank", "noopener") : undefined}
        />
    )
}
