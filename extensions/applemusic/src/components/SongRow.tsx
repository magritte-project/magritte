import type { ReactNode } from "react"

import AddToLibraryButton from "@/components/AddToLibraryButton"
import ArtworkImage from "@/components/reusable/ArtworkImage"
import ItemRow from "@/components/reusable/ItemRow"
import type { SongResource } from "@/musickit/models/song"
import { joinDetails } from "@/utilities/format"

export interface SongRowProps {
    readonly song: SongResource
    /** Replaces the song's artwork, e.g. with a track number */
    readonly leading?: ReactNode
    /** Replaces the default "artist · album" subtitle */
    readonly subtitle?: string
    readonly onPlay: () => void
}

export default function SongRow({ song, leading, subtitle, onPlay }: SongRowProps) {
    return (
        <ItemRow
            leading={
                leading ?? (
                    <ArtworkImage
                        className="h-8 aspect-square shrink-0"
                        artwork={song.attributes?.artwork}
                        itemTitle={song.attributes?.name}
                    />
                )
            }
            title={song.attributes?.name}
            subtitle={
                subtitle ?? joinDetails(song.attributes?.artistName, song.attributes?.albumName)
            }
            onClick={onPlay}
            accessory={<AddToLibraryButton songs={[song]} />}
        />
    )
}
